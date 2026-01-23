import { getTenantCollections } from "../../config/db.js";
import { ObjectId } from "mongodb";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { format, parse } from "date-fns";

// Helper function to parse DD-MM-YYYY format
const parseDateFromString = (dateString) => {
  if (!dateString) return undefined;
  try {
    // Try parsing DD-MM-YYYY format first
    const parsed = parse(dateString, "dd-MM-yyyy", new Date());
    if (isNaN(parsed.getTime())) {
      // Fall back to Date constructor for ISO format
      const fallback = new Date(dateString);
      return isNaN(fallback.getTime()) ? undefined : fallback;
    }
    return parsed;
  } catch (error) {
    console.error("[ProjectService] Error parsing date:", { dateString, error });
    return undefined;
  }
};

// Helper function to generate next project ID
const generateNextProjectId = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const lastProject = await collections.projects.findOne(
      {},
      { sort: { createdAt: -1 } }
    );
    
    let nextId = 1;
    if (lastProject && lastProject.projectId) {
      const lastIdNumber = parseInt(lastProject.projectId.replace("PRO-", ""));
      nextId = lastIdNumber + 1;
    }

    const projectId = `PRO-${String(nextId).padStart(4, "0")}`;
    return projectId;
  } catch (error) {
    console.error('Error generating project ID:', error);
    throw error;
  }
};

export const createProject = async (companyId, projectData) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[ProjectService] createProject", {
      companyId,
      projectData,
    });

    // Generate projectId
    const projectId = await generateNextProjectId(companyId);

    const newProject = {
      ...projectData,
      projectId,
      companyId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: projectData.status || "active",
      isDeleted: false,
      
      priority: projectData.priority || "medium",
      progress: projectData.progress || 0,
      teamMembers: projectData.teamMembers ? projectData.teamMembers.map(id => new ObjectId(id)) : [],
      teamLeader: projectData.teamLeader ? projectData.teamLeader.map(id => new ObjectId(id)) : [],
      projectManager: projectData.projectManager ? projectData.projectManager.map(id => new ObjectId(id)) : [],
      tags: projectData.tags || [],
      startDate: parseDateFromString(projectData.startDate),
      dueDate: parseDateFromString(projectData.endDate || projectData.dueDate),
    };
    
    // Remove endDate if it exists (we use dueDate in schema)
    delete newProject.endDate;

    const result = await collections.projects.insertOne(newProject);
    console.log("[ProjectService] insertOne result", { result });

    if (result.insertedId) {
      const inserted = await collections.projects.findOne({
        _id: result.insertedId,
      });
      console.log("[ProjectService] inserted project", { inserted });
      return { done: true, data: inserted };
    } else {
      console.error("[ProjectService] Failed to insert project");
      return { done: false, error: "Failed to insert project" };
    }
  } catch (error) {
    console.error("[ProjectService] Error in createProject", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};


export const getProjects = async (companyId, filters = {}) => {
  try {
    const collections = getTenantCollections(companyId);

    const query = { isDeleted: { $ne: true } };

    if (Array.isArray(filters.status) && filters.status.length > 0) {
      query.status = { $in: filters.status };
    } else if (filters.status && typeof filters.status === 'object' && filters.status.$ne) {
      // Handle exclusion filter like { $ne: 'Completed' }
      query.status = filters.status;
    } else if (filters.status && filters.status !== "all") {
      query.status = filters.status;
    }

    if (Array.isArray(filters.priority) && filters.priority.length > 0) {
      query.priority = { $in: filters.priority };
    } else if (filters.priority && filters.priority !== "all") {
      query.priority = filters.priority;
    }

    if (Array.isArray(filters.client) && filters.client.length > 0) {
      query.client = { $in: filters.client };
    } else if (filters.client && filters.client !== "all") {
      query.client = filters.client;
    }

    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    if (filters.search) {
      query.name = { $regex: filters.search, $options: "i" };
    }

    const sort = { createdAt: -1 };

    const projects = await collections.projects
      .find(query)
      .sort(sort)
      .toArray();
    

    // Compute task counts per project
    const taskCounts = await Promise.all(
      projects.map(async (project) => {
        const count = await collections.tasks.countDocuments({
          projectId: new ObjectId(project._id),
          isDeleted: { $ne: true },
        });

        return {
          projectId: project.projectId?.toString?.() || String(project.projectId || project._id),
          taskCount: count,
        };
      })
    );

    const teamLeadDetails = await Promise.all(
      projects.map(async (project) => {
        const teamleadIds = Array.isArray(project.teamLeader) ? project.teamLeader : [];
        if (!teamleadIds.length) {
          return { projectId: project.projectId.toString(), teamleadName: [] };
        }
        const teamleads = await collections.employees
          .find(
            {
              _id: { $in: teamleadIds.map(id => new ObjectId(id)) },
              status: "Active",
            },
            { projection: { employeeId: 1, firstName: 1, lastName: 1, _id: 1 } }
          )
          .toArray();

        const names = teamleads.map((e) => ({
          name: `${e.firstName || ""} ${e.lastName || ""}`.trim(),
          employeeId: e.employeeId,
        }));

        return { projectId: project.projectId.toString(), teamleadName: names };
      })
    );

    const completedtaskcounts = await Promise.all(
      projects.map(async (project) => {
        const count = await collections.tasks.countDocuments({
          projectId: new ObjectId(project._id),
          status: { $in: ["Completed", "completed", "COMPLETED"] },
          isDeleted: { $ne: true }
        });
        return {
          projectId: project.projectId.toString(),
          completedtaskCount: count,
        };
      })
    );

    const processedProjects = projects.map((project) => {
      const taskEntry = taskCounts.find(
        (t) => t.projectId === project.projectId.toString()
      );

      const completedTaskEntry = completedtaskcounts.find(
        (t) => t.projectId === project.projectId.toString()
      );

      const teamLeadEntry = teamLeadDetails.find(
        (t) => t.projectId === project.projectId.toString()
      );

      return {
        ...project,
        createdAt: project.createdAt ? new Date(project.createdAt) : null,
        updatedAt: project.updatedAt ? new Date(project.updatedAt) : null,
        startDate: project.startDate ? new Date(project.startDate) : null,
        endDate: project.dueDate ? new Date(project.dueDate) : null,
        taskCount: taskEntry?.taskCount || 0,
        completedtaskCount: completedTaskEntry?.completedtaskCount || 0,
        teamleadName: teamLeadEntry?.teamleadName || [],
        teamMembersdetail: [] // Initialize empty, will be populated below
      };
    });

    // Fetch team members details for each project
    const projectsWithTeamMembers = await Promise.all(
      processedProjects.map(async (project) => {
        const teamMembersArray = Array.isArray(project.teamMembers) ? project.teamMembers : [];
        if (teamMembersArray.length > 0) {
          const employees = await collections.employees
            .find(
              {
                _id: { $in: teamMembersArray.map(id => new ObjectId(id)) },
                status: "Active",
              },
              {
                projection: {
                  employeeId: 1,
                  firstName: 1,
                  lastName: 1,
                  _id: 1
                }
              }
            )
            .toArray();
          project.teamMembersdetail = employees;
        } else {
          project.teamMembersdetail = [];
        }
        return project;
      })
    );

    return { done: true, data: projectsWithTeamMembers };
  } catch (error) {
    console.error("[ProjectService] Error in getProjects", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};


export const getProjectById = async (companyId, projectId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[ProjectService] getProjectById", { companyId, projectId });

    if (!ObjectId.isValid(projectId)) {
      console.error("[ProjectService] Invalid ObjectId format", {
        projectId,
      });
      return { done: false, error: "Invalid project ID format" };
    }

    const project = await collections.projects.findOne({
      _id: new ObjectId(projectId)
    });

    if (!project) {
      console.error("[ProjectService] Project not found", { projectId });
      return { done: false, error: "Project not found" };
    }
    // Fetch team members details if array exists
    const teamMembersArray = Array.isArray(project.teamMembers) ? project.teamMembers : [];
    const employees = teamMembersArray.length > 0 
      ? await collections.employees
          .find(
            {
              _id: { $in: teamMembersArray.map(id => new ObjectId(id)) },
              status: "Active",
            },
            {
              projection: {
                employeeId: 1,
                firstName: 1,
                lastName: 1,
                _id: 1
              }
            }
          )
          .toArray()
      : [];

    project.teamMembersdetail = employees;
    
    // Fetch team leader details if array exists
    const teamLeaderArray = Array.isArray(project.teamLeader) ? project.teamLeader : [];
    const teamLeaderdetail = teamLeaderArray.length > 0
      ? await collections.employees
          .find(
            {
              _id: { $in: teamLeaderArray.map(id => new ObjectId(id)) },
              status: "Active",
            },
            {
              projection: {
                employeeId: 1,
                firstName: 1,
                lastName: 1,
                _id: 1
              }
            }
          )
          .toArray()
      : [];

    project.teamLeaderdetail = teamLeaderdetail;

    // Fetch project manager details if array exists
    const projectManagerArray = Array.isArray(project.projectManager) ? project.projectManager : [];
    const projectmanagerdetail = projectManagerArray.length > 0
      ? await collections.employees
          .find(
            {
              _id: { $in: projectManagerArray.map(id => new ObjectId(id)) },
              status: "Active",
            },
            {
              projection: {
                employeeId: 1,
                firstName: 1,
                lastName: 1,
                _id: 1
              }
            }
          )
          .toArray()
      : [];

    project.projectManagerdetail = projectmanagerdetail;
    
    const processedProject = {
      ...project,
      createdAt: project.createdAt ? new Date(project.createdAt) : null,
      updatedAt: project.updatedAt ? new Date(project.updatedAt) : null,
      startDate: project.startDate ? new Date(project.startDate) : null,
      endDate: project.dueDate ? new Date(project.dueDate) : null,
    };

    return { done: true, data: processedProject };
  } catch (error) {
    console.error("[ProjectService] Error in getProjectById", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};


export const updateProject = async (companyId, projectId, updateData) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[ProjectService] updateProject", {
      companyId,
      projectId,
      updateData,
    });

    if (!ObjectId.isValid(projectId)) {
      console.error("[ProjectService] Invalid ObjectId format", {
        projectId,
      });
      return { done: false, error: "Invalid project ID format" };
    }

    
    const existingProject = await collections.projects.findOne({
      _id: new ObjectId(projectId),
    });

    if (!existingProject) {
      console.error("[ProjectService] Project not found for update", {
        projectId,
      });
      return { done: false, error: "Project not found" };
    }

    
    const updateFields = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Map start/end dates to schema fields
    if (updateData.startDate) {
      updateFields.startDate = parseDateFromString(updateData.startDate);
    }
    if (updateData.endDate) {
      updateFields.dueDate = parseDateFromString(updateData.endDate);
      delete updateFields.endDate;
    }

    // Convert teamMembers, teamLeader, and projectManager to ObjectId arrays if provided
    if (updateData.teamMembers) {
      updateFields.teamMembers = updateData.teamMembers.map(id => new ObjectId(id));
    }
    if (updateData.teamLeader) {
      updateFields.teamLeader = updateData.teamLeader.map(id => new ObjectId(id));
    }
    if (updateData.projectManager) {
      updateFields.projectManager = updateData.projectManager.map(id => new ObjectId(id));
    }

    // Ensure tags is an array
    if (updateData.tags !== undefined) {
      updateFields.tags = Array.isArray(updateData.tags) ? updateData.tags : [];
    }

    console.log("[ProjectService] Before update - tags in updateData:", updateData.tags);
    console.log("[ProjectService] Before update - updateFields.tags:", updateFields.tags);
    console.log("[ProjectService] updateFields", { updateFields });

    
    const result = await collections.projects.updateOne(
      { _id: new ObjectId(projectId) },
      { $set: updateFields }
    );
    console.log("[ProjectService] update result", { result });

    if (result.matchedCount === 0) {
      console.error("[ProjectService] Project not found for update", {
        projectId,
      });
      return { done: false, error: "Project not found" };
    }

    
    const updatedProject = await collections.projects.findOne({
      _id: new ObjectId(projectId),
    });
    console.log("[ProjectService] updated project - tags field:", updatedProject.tags);
    console.log("[ProjectService] updated project", { updatedProject });

    return { done: true, data: updatedProject };
  } catch (error) {
    console.error("[ProjectService] Error in updateProject", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};


export const deleteProject = async (companyId, projectId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[ProjectService] deleteProject", { companyId, projectId });

    if (!ObjectId.isValid(projectId)) {
      console.error("[ProjectService] Invalid ObjectId format", {
        projectId,
      });
      return { done: false, error: "Invalid project ID format" };
    }

    
    const existingProject = await collections.projects.findOne({
      _id: new ObjectId(projectId),
      companyId,
      isDeleted: { $ne: true },
    });

    if (!existingProject) {
      console.error("[ProjectService] Project not found for delete", {
        projectId,
      });
      return { done: false, error: "Project not found" };
    }

    
    const result = await collections.projects.updateOne(
      { _id: new ObjectId(projectId), companyId },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    console.log("[ProjectService] delete result", { result });

    if (result.matchedCount === 0) {
      console.error("[ProjectService] Project not found for delete", {
        projectId,
      });
      return { done: false, error: "Project not found" };
    }

    return { done: true, data: existingProject };
  } catch (error) {
    console.error("[ProjectService] Error in deleteProject", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};


export const getProjectStats = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[ProjectService] getProjectStats", { companyId });

    const pipeline = [
      { $match: { companyId, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          onHold: {
            $sum: { $cond: [{ $eq: ["$status", "on-hold"] }, 1, 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ["$dueDate", new Date()] },
                    { $ne: ["$status", "completed"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ];

    const stats = await collections.projects.aggregate(pipeline).toArray();
    const result = stats[0] || {
      total: 0,
      active: 0,
      completed: 0,
      onHold: 0,
      overdue: 0,
    };

    
    const priorityPipeline = [
      { $match: { companyId, isDeleted: { $ne: true } } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    const priorityStats = await collections.projects
      .aggregate(priorityPipeline)
      .toArray();

    
    const statusPipeline = [
      { $match: { companyId, isDeleted: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ];

    const statusStats = await collections.projects
      .aggregate(statusPipeline)
      .toArray();

    return {
      done: true,
      data: {
        ...result,
        priorityDistribution: priorityStats,
        statusDistribution: statusStats,
      },
    };
  } catch (error) {
    console.error("[ProjectService] Error in getProjectStats", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};


export const getProjectClients = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[ProjectService] getProjectClients", { companyId });

    const clients = await collections.clients.distinct("name", {
      isDeleted: { $ne: true },
    });

    return { done: true, data: clients };
  } catch (error) {
    console.error("[ProjectService] Error in getProjectClients", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};

// Get team members for a specific project
export const getProjectTeamMembers = async (companyId, projectId) => {
  try {
    const collections = getTenantCollections(companyId);

    if (!ObjectId.isValid(projectId)) {
      return { done: false, error: "Invalid project ID format" };
    }

    // Get the project
    const project = await collections.projects.findOne({
      _id: new ObjectId(projectId)
    });

    if (!project) {
      return { done: false, error: "Project not found" };
    }

    // Get team members array (stored as employee IDs)
    const teamMemberIds = Array.isArray(project.teamMembers) ? project.teamMembers : [];

    if (teamMemberIds.length === 0) {
      return { done: true, data: { teamMembers: [] } };
    }

    // Fetch employee details for each team member ID
    const employees = await collections.employees
      .find(
        {
          _id: { $in: teamMemberIds.map(id => new ObjectId(id)) },
          status: "Active",
        },
        {
          projection: {
            employeeId: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            _id: 1
          }
        }
      )
      .sort({ firstName: 1 })
      .toArray();

    console.log("[ProjectService] Found employees:", employees.length);

    return {
      done: true,
      data: { teamMembers: employees },
    };
  } catch (error) {
    console.error("[ProjectService] Error in getProjectTeamMembers", {
      error: error.message,
    });
    return { done: false, error: error.message };
  }
};


export const exportProjectsPDF = async (companyId) => {
  try {
    console.log("Starting PDF generation for projects:", companyId);

    if (!companyId) {
      throw new Error("Company ID is required");
    }

    const collections = getTenantCollections(companyId);

    if (!collections || !collections.projects) {
      throw new Error("Projects collection not found for company");
    }

    
    const projects = await collections.projects
      .find({
        companyId,
        isDeleted: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .toArray();

    if (!projects || projects.length === 0) {
      throw new Error("No projects found for export");
    }

    
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
    });

    const fileName = `projects_${companyId}_${Date.now()}.pdf`;
    const tempDir = path.join(process.cwd(), "temp");
    const filePath = path.join(tempDir, fileName);

    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    
    const primaryColor = "#333333";
    const secondaryColor = "#666666";
    const accentColor = "#0d6efd";
    const pageWidth = doc.page.width - 100;

    
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("Projects Report", 50, 50)
      .moveDown(0.5);

    
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor(secondaryColor)
      .text(`Generated on: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, {
        align: "right",
      })
      .text(`Total Projects: ${projects.length}`, { align: "right" })
      .moveDown(2);

    
    const tableTop = 150;
    const columnWidth = pageWidth / 5;

    
    doc
      .rect(50, tableTop - 10, pageWidth, 30)
      .fillColor("#f8f9fa")
      .fill();

    
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(primaryColor)
      .text("Name", 50, tableTop, { width: columnWidth })
      .text("Client", 50 + columnWidth, tableTop, { width: columnWidth })
      .text("Status", 50 + columnWidth * 2, tableTop, { width: columnWidth })
      .text("Priority", 50 + columnWidth * 3, tableTop, { width: columnWidth })
      .text("End Date", 50 + columnWidth * 4, tableTop, {
        width: columnWidth,
      });

    
    let currentY = tableTop + 20;
    projects.forEach((project, index) => {
      
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = 50;
      }

      
      const formatDate = (dateValue) => {
        try {
          if (!dateValue) return "N/A";
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return "N/A";
          return format(date, "dd/MM/yyyy");
        } catch (error) {
          console.warn("Date formatting error:", error);
          return "N/A";
        }
      };

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(secondaryColor)
        .text(project.name || "N/A", 50, currentY, { width: columnWidth })
        .text(project.client || "N/A", 50 + columnWidth, currentY, {
          width: columnWidth,
        })
        .text(project.status || "N/A", 50 + columnWidth * 2, currentY, {
          width: columnWidth,
        })
        .text(project.priority || "N/A", 50 + columnWidth * 3, currentY, {
          width: columnWidth,
        })
        .text(formatDate(project.endDate), 50 + columnWidth * 4, currentY, {
          width: columnWidth,
        });

      currentY += 20;
    });

    
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#999999")
        .text(`Page ${i + 1} of ${pages.count}`, 50, doc.page.height - 30, {
          align: "center",
        });
    }

    
    doc.end();

    
    await new Promise((resolve, reject) => {
      stream.on("finish", () => {
        console.log("PDF file written successfully");
        resolve();
      });
      stream.on("error", (err) => {
        console.error("Error writing PDF file:", err);
        reject(err);
      });
    });

    
    if (!fs.existsSync(filePath)) {
      throw new Error("PDF file was not created");
    }

    console.log("PDF generation completed successfully");
    const frontendurl = process.env.FRONTEND_URL + `/temp/${fileName}`;
    return {
      done: true,
      data: {
        pdfPath: filePath,
        pdfUrl: frontendurl,
      },
    };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return { done: false, error: error.message };
  }
};


export const exportProjectsExcel = async (companyId) => {
  try {
    console.log("Starting Excel generation for projects:", companyId);

    if (!companyId) {
      throw new Error("Company ID is required");
    }

    const collections = getTenantCollections(companyId);

    if (!collections || !collections.projects) {
      throw new Error("Projects collection not found for company");
    }

    
    const projects = await collections.projects
      .find({
        companyId,
        isDeleted: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .toArray();

    if (!projects || projects.length === 0) {
      throw new Error("No projects found for export");
    }

    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Projects");

    
    worksheet.columns = [
      { header: "Name", key: "name", width: 40 },
      { header: "Client", key: "client", width: 20 },
      { header: "Status", key: "status", width: 15 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Start Date", key: "startDate", width: 15 },
      { header: "End Date", key: "endDate", width: 15 },
      { header: "Progress", key: "progress", width: 10 },
      { header: "Created Date", key: "createdAt", width: 15 },
    ];

    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    
    const formatDate = (dateValue) => {
      try {
        if (!dateValue) return "N/A";
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "N/A";
        return format(date, "dd/MM/yyyy");
      } catch (error) {
        console.warn("Date formatting error:", error);
        return "N/A";
      }
    };

    
    projects.forEach((project) => {
      worksheet.addRow({
        name: project.name || "N/A",
        client: project.client || "N/A",
        status: project.status || "N/A",
        priority: project.priority || "N/A",
        startDate: formatDate(project.startDate),
        endDate: formatDate(project.endDate),
        progress: project.progress || 0,
        createdAt: formatDate(project.createdAt),
      });
    });

    
    const totalRow = worksheet.addRow({
      name: "TOTAL",
      client: projects.length,
      status: "",
      priority: "",
      startDate: "",
      endDate: "",
      progress: "",
      createdAt: "",
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F0F0" },
    };

    
    const fileName = `projects_${companyId}_${Date.now()}.xlsx`;
    const tempDir = path.join(process.cwd(), "temp");
    const filePath = path.join(tempDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    console.log("Excel generation completed successfully");

    const excelendurl = process.env.FRONTEND_URL + `/temp/${fileName}`;

    return {
      done: true,
      data: {
        excelPath: filePath,
        excelUrl: excelendurl,
      },
    };
  } catch (error) {
    console.error("Error generating Excel:", error);
    return { done: false, error: error.message };
  }
};

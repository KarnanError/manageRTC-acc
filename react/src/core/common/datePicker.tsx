import React, { useState, useEffect } from "react";
import { DateRangePicker } from "react-bootstrap-daterangepicker";
import moment from "moment";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-daterangepicker/daterangepicker.css";
import "./style.css";

interface DateRange {
  start: string;
  end: string;
}

interface PredefinedDateRangesProps {
  onChange?: (range: DateRange) => void;
  value?: DateRange;
  displayFormat?: string;
  outputFormat?: string;
}

const PredefinedDateRanges: React.FC<PredefinedDateRangesProps> = ({
  onChange,
  value,
  displayFormat = "MM/DD/YYYY",
  outputFormat,
}) => {
  const defaultStart = moment.utc("1970-01-01T00:00:00Z");
  const defaultEnd = moment.utc();
  const DATE_FORMAT = outputFormat;

  const [range, setRange] = useState<DateRange>(() => {
    if (value) {
      return { start: value.start, end: value.end };
    } else {
      return {
        start: DATE_FORMAT ? defaultStart.format(DATE_FORMAT) : defaultStart.toISOString(),
        end: DATE_FORMAT ? defaultEnd.format(DATE_FORMAT) : defaultEnd.toISOString(),
      };
    }
  });

  useEffect(() => {
    if (value) {
      setRange({
        start: value.start,
        end: value.end,
      });
    }
  }, [value]);

  const handleApply = (event: any, picker: any) => {
    const newRange = {
      start: DATE_FORMAT
        ? picker.startDate.utc().format(DATE_FORMAT)
        : picker.startDate.utc().toISOString(),
      end: DATE_FORMAT
        ? picker.endDate.utc().format(DATE_FORMAT)
        : picker.endDate.utc().toISOString(),
    };
    setRange(newRange);
    onChange?.(newRange);
  };

  const startMoment = DATE_FORMAT
    ? moment.utc(range.start, DATE_FORMAT)
    : moment.utc(range.start);
  const endMoment = DATE_FORMAT
    ? moment.utc(range.end, DATE_FORMAT)
    : moment.utc(range.end);

  const isAllTime =
    startMoment.isSame(defaultStart, "day") &&
    endMoment.isSame(defaultEnd, "day");

  const label = isAllTime
    ? "All Time"
    : `${startMoment.format(displayFormat)} - ${endMoment.format(displayFormat)}`;

  return (
    <div className="date-range-container" style={{ minWidth: "250px" }}>
      <DateRangePicker
        initialSettings={{
          startDate: startMoment.toDate(),
          endDate: endMoment.toDate(),
          ranges: {
            "All Time": [defaultStart.toDate(), defaultEnd.toDate()],
            Today: [
              moment.utc().startOf("day").toDate(),
              moment.utc().endOf("day").toDate(),
            ],
            Yesterday: [
              moment.utc().subtract(1, "days").startOf("day").toDate(),
              moment.utc().subtract(1, "days").endOf("day").toDate(),
            ],
            "Last 7 Days": [
              moment.utc().subtract(6, "days").startOf("day").toDate(),
              moment.utc().endOf("day").toDate(),
            ],
            "Last 30 Days": [
              moment.utc().subtract(29, "days").startOf("day").toDate(),
              moment.utc().endOf("day").toDate(),
            ],
            "This Month": [
              moment.utc().startOf("month").toDate(),
              moment.utc().endOf("month").toDate(),
            ],
            "Last Month": [
              moment.utc().subtract(1, "month").startOf("month").toDate(),
              moment.utc().subtract(1, "month").endOf("month").toDate(),
            ],
          },
        }}
        onApply={handleApply}
      >
        {/* Replace select with button to avoid two dropdowns */}
        <button
          type="button"
          className="btn outline-grey"
          style={{
            minWidth: "250px",
            textAlign: "left",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            outlineWidth: "1px",
            border: "1px #EAE0E3 solid",
          }}
        >
          <span>{label}</span>
        </button>
      </DateRangePicker>
    </div>
  );
};

export default PredefinedDateRanges;

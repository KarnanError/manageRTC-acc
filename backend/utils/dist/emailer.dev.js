"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _email = _interopRequireDefault(require("../config/email.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var sendCredentialsEmail = function sendCredentialsEmail(_ref) {
  var to, companyName, password, loginLink, mailOptions;
  return regeneratorRuntime.async(function sendCredentialsEmail$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          to = _ref.to, companyName = _ref.companyName, password = _ref.password, loginLink = _ref.loginLink;
          _context.prev = 1;
          mailOptions = {
            from: "\"ManageRTC\" <noreply@amasqis.ai>",
            to: to,
            subject: "[".concat(companyName, "] Your login credentials"),
            html: "\n        <div style=\"font-family: Arial, sans-serif; margin: 0; padding: 0; background: #f4f4f4;\">\n          <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background: #f4f4f4; padding: 20px;\">\n            <tr>\n              <td align=\"center\">\n                <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background: #ffffff; padding: 40px; border-radius: 8px;\">\n                  <tr>\n                    <td align=\"center\">\n                      <h2 style=\"color: #333;\">Welcome to Amasqis.ai</h2>\n                      <p style=\"font-size: 16px; color: #666;\">Your company has been successfully registered and verified</p>\n                      <p style=\"font-size: 16px; color: #666;\">Here are your company admin login details:</p>\n                      <table cellpadding=\"8\" cellspacing=\"0\" width=\"100%\" style=\"margin: 20px 0;\">\n                        <tr>\n                          <td style=\"text-align: right; font-weight: bold; width: 30%;\">Email:</td>\n                          <td style=\"text-align: left;\">".concat(to, "</td>\n                        </tr>\n                        <tr>\n                          <td style=\"text-align: right; font-weight: bold;\">Password:</td>\n                          <td style=\"text-align: left;\">").concat(password, "</td>\n                        </tr>\n                      </table>\n                      <a href=\"").concat(loginLink, "\" style=\"display: inline-block; background: #6c4eff; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; margin-top: 20px;\">\n                        Log In Now\n                      </a>\n                      <p style=\"margin-top: 30px; font-size: 14px; color: #888;\">\n                        If the button doesn\u2019t work, <a href=\"").concat(loginLink, "\" style=\"color: #6c4eff;\">click here</a>.\n                      </p>\n                      <p style=\"font-size: 12px; color: #ccc;\">Please do not reply to this email.</p>\n                      <p style=\"font-size: 10px; color: #ccc;\"><a href=\"https://www.amasqis.ai\">Amasqis.ai</a></p>\n                    </td>\n                  </tr>\n                </table>\n              </td>\n            </tr>\n          </table>\n        </div>")
          };
          _context.next = 5;
          return regeneratorRuntime.awrap(_email["default"].sendMail(mailOptions));

        case 5:
          console.log("\u2705 Email sent to ".concat(to));
          _context.next = 12;
          break;

        case 8:
          _context.prev = 8;
          _context.t0 = _context["catch"](1);
          console.error("\u274C Failed to send email to ".concat(to, ":"), _context.t0.message); // Optionally throw or return an error object

          throw new Error("Email sending failed");

        case 12:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 8]]);
};

var _default = sendCredentialsEmail;
exports["default"] = _default;
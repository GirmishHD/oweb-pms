export var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["DRAFT"] = "Draft";
    ProjectStatus["SUBMITTED"] = "Submitted";
    ProjectStatus["UNDER_REVIEW"] = "Under Review";
    ProjectStatus["APPROVED"] = "Approved";
    ProjectStatus["REJECTED"] = "Rejected";
    ProjectStatus["CANCELLED"] = "Cancelled";
    ProjectStatus["COMPLETED"] = "Completed";
})(ProjectStatus || (ProjectStatus = {}));
export var Role;
(function (Role) {
    Role["USER"] = "User";
    Role["REVIEWER"] = "Reviewer";
    Role["ADMIN"] = "Admin";
    Role["PROCUREMENT"] = "Procurement";
    Role["CONTRACT_MANAGER"] = "Contract Manager";
    Role["SUPERVISOR"] = "Supervisor";
    Role["AUDITOR"] = "Auditor";
    Role["DIRECTOR"] = "Director";
    Role["COORDINATOR"] = "Coordinator";
    Role["TEAM_LEADER"] = "Team Leader";
    Role["ENGINEER"] = "Engineer";
    Role["FINANCE_OFFICER"] = "Finance Officer";
    Role["PLANNING_OFFICER"] = "Planning Officer";
    Role["ME_OFFICER"] = "Monitoring & Evaluation Officer";
    Role["PARTNER_MEMBER"] = "NGO/Partner Member";
    Role["VIEWER"] = "Viewer";
})(Role || (Role = {}));
export var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "Active";
    UserStatus["INACTIVE"] = "Inactive";
    UserStatus["SUSPENDED"] = "Suspended";
})(UserStatus || (UserStatus = {}));
export var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "info";
    NotificationType["ALERT"] = "alert";
    NotificationType["SUCCESS"] = "success";
    NotificationType["NEW_SUBMISSION"] = "new_submission";
    NotificationType["APPROVAL_REQUIRED"] = "approval_required";
    NotificationType["SYSTEM"] = "system";
})(NotificationType || (NotificationType = {}));
export var DocumentCategory;
(function (DocumentCategory) {
    DocumentCategory["FEASIBILITY_STUDY"] = "Feasibility Study";
    DocumentCategory["EIA_REPORT"] = "EIA Report";
    DocumentCategory["CONTRACT_AGREEMENT"] = "Contract Agreement";
    DocumentCategory["TECHNICAL_DRAWING"] = "Technical Drawing";
    DocumentCategory["PROGRESS_REPORT"] = "Progress Report";
    DocumentCategory["PHOTO"] = "Photo";
    DocumentCategory["OTHER"] = "Other";
})(DocumentCategory || (DocumentCategory = {}));
export var Priority;
(function (Priority) {
    Priority["HIGH"] = "High";
    Priority["MEDIUM"] = "Medium";
    Priority["LOW"] = "Low";
})(Priority || (Priority = {}));
export var InsightLevel;
(function (InsightLevel) {
    InsightLevel["INFO"] = "Info";
    InsightLevel["WARNING"] = "Warning";
    InsightLevel["CRITICAL"] = "Critical";
    InsightLevel["SUCCESS"] = "Success";
})(InsightLevel || (InsightLevel = {}));

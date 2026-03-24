import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Array "mo:core/Array";
import VarArray "mo:core/VarArray";
import Principal "mo:core/Principal";



actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);

  // Helper function to check if caller is approved or admin
  func isApprovedOrAdmin(caller : Principal) : Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  // Approval System
  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  // Check if admin has been assigned yet (used for first-time setup UI)
  public query func isAdminAssigned() : async Bool {
    accessControlState.adminAssigned;
  };

  // User Profiles
  public type UserProfile = {
    name : Text;
    email : Text;
    department : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    if (caller == user and not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can view profiles");
    };
    userProfiles.get(user);
  };

  // Kept for upgrade compatibility (previously used for hardcoded admin, now unused)
  stable var DESIGNATED_ADMIN_EMAIL : Text = "";

  // Platform license key for first-run admin claim
  var platformLicenseKey : Text = "";
  var platformSetupDone : Bool = false;

  public query func isPlatformSetupDone() : async Bool {
    platformSetupDone;
  };

  public query func getLicenseKeyStatus() : async Bool {
    platformLicenseKey != "";
  };

  public shared ({ caller }) func setLicenseKey(key : Text) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only platform admin can set license key");
    };
    platformLicenseKey := key;
    true;
  };

  public shared ({ caller }) func claimPlatformAdminWithKey(licenseKey : Text) : async { #ok; #err : Text } {
    if (accessControlState.adminAssigned) {
      return #err("Platform admin already assigned");
    };
    if (platformLicenseKey == "") {
      return #err("License key not configured. Contact your platform provider.");
    };
    if (licenseKey != platformLicenseKey) {
      return #err("Invalid license key");
    };
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    UserApproval.setApproval(approvalState, caller, #approved);
    platformSetupDone := true;
    #ok;
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Document Management
  type DocumentStatus = {
    #notStarted;
    #inProgress;
    #completed;
    #approved;
  };

  type Document = {
    id : Nat;
    title : Text;
    clauseNumber : Text;
    clauseName : Text;
    controlNumber : Text;
    controlName : Text;
    description : Text;
    status : DocumentStatus;
    owner : Text;
    createdAt : Int;
    updatedAt : Int;
    fileId : ?Text;
    isAnnexA : Bool;
  };

  type CreateDocumentInput = {
    title : Text;
    clauseNumber : Text;
    clauseName : Text;
    controlNumber : Text;
    controlName : Text;
    description : Text;
    owner : Text;
    fileId : ?Text;
    isAnnexA : Bool;
  };

  type UpdateDocumentInput = {
    id : Nat;
    title : ?Text;
    clauseNumber : ?Text;
    clauseName : ?Text;
    controlNumber : ?Text;
    controlName : ?Text;
    description : ?Text;
    owner : ?Text;
    fileId : ?Text;
    isAnnexA : ?Bool;
  };

  // Risk Management Types
  public type ThreatCategory = {
    #hostileInsiders;
    #nonHostileInsiders;
    #hostileOutsiders;
    #nonHostileOutsiders;
    #technicalProblems;
    #dependencyProblems;
    #legal;
    #environmental;
  };

  public type MaturityLevel = {
    #critical;
    #high;
    #medium;
    #low;
    #veryLow;
  };

  public type MitigationControl = {
    controlId : Text;
    controlName : Text;
    maturityLevel : MaturityLevel;
  };

  public type RiskLevel = {
    #low;
    #medium;
    #high;
    #critical;
  };

  public type RiskStatus = {
    #open;
    #inTreatment;
    #closed;
  };

  public type RiskTreatment = {
    #accept;
    #mitigate;
    #transfer;
    #avoid;
  };

  public type RiskItem = {
    id : Nat;
    tenantId : Nat;
    title : Text;
    description : Text;
    threatCategory : ThreatCategory;
    vulnerability : Text;
    likelihood : Nat;
    impact : Nat;
    inherentRiskScore : Nat;
    mitigationControls : [MitigationControl];
    residualRiskScore : Nat;
    riskLevel : RiskLevel;
    treatment : RiskTreatment;
    treatmentOwner : Text;
    treatmentNotes : Text;
    treatmentPlanDescription : Text;
    treatmentPlanOwner : Text;
    treatmentPlanTargetDate : Text;
    treatmentPlanReviewDate : Text;
    dueDate : Text;
    status : RiskStatus;
    createdAt : Int;
    updatedAt : Int;
  };

  public type CreateRiskInput = {
    title : Text;
    description : Text;
    threatCategory : ThreatCategory;
    vulnerability : Text;
    likelihood : Nat;
    impact : Nat;
    mitigationControls : [MitigationControl];
    treatment : RiskTreatment;
    treatmentOwner : Text;
    treatmentNotes : Text;
    treatmentPlanDescription : Text;
    treatmentPlanOwner : Text;
    treatmentPlanTargetDate : Text;
    treatmentPlanReviewDate : Text;
    dueDate : Text;
    status : ?RiskStatus;
  };

  public type UpdateRiskInput = {
    id : Nat;
    title : ?Text;
    description : ?Text;
    threatCategory : ?ThreatCategory;
    vulnerability : ?Text;
    likelihood : ?Nat;
    impact : ?Nat;
    mitigationControls : ?[MitigationControl];
    treatment : ?RiskTreatment;
    treatmentOwner : ?Text;
    treatmentNotes : ?Text;
    treatmentPlanDescription : ?Text;
    treatmentPlanOwner : ?Text;
    treatmentPlanTargetDate : ?Text;
    treatmentPlanReviewDate : ?Text;
    dueDate : ?Text;
    status : ?RiskStatus;
  };

  public type RiskStats = {
    total : Nat;
    avgInherentScore : Nat;
    avgResidualScore : Nat;
    byLevel : [(RiskLevel, Nat)];
    byStatus : [(RiskStatus, Nat)];
  };

  // Governance Types
  type GovernanceCategory = {
    #policy;
    #committee;
    #meeting;
    #actionItem;
  };

  type GovernanceStatus = {
    #draft;
    #active;
    #underReview;
    #retired;
  };

  type GovernanceItem = {
    id : Nat;
    title : Text;
    category : GovernanceCategory;
    description : Text;
    owner : Text;
    status : GovernanceStatus;
    reviewDate : Text;
    approvedBy : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  type CreateGovernanceItemInput = {
    title : Text;
    category : GovernanceCategory;
    description : Text;
    owner : Text;
    reviewDate : Text;
    approvedBy : Text;
  };

  type UpdateGovernanceItemInput = {
    id : Nat;
    title : ?Text;
    category : ?GovernanceCategory;
    description : ?Text;
    owner : ?Text;
    reviewDate : ?Text;
    approvedBy : ?Text;
    status : ?GovernanceStatus;
  };

  type GovernanceSummary = {
    total : Nat;
    byCategory : [(GovernanceCategory, Nat)];
    byStatus : [(GovernanceStatus, Nat)];
  };

  // Compliance Types
  type ComplianceFramework = {
    id : Nat;
    name : Text;
    description : Text;
    version : Text;
  };

  type ControlStatus = {
    #notApplicable;
    #notImplemented;
    #partiallyImplemented;
    #fullyImplemented;
  };

  type ComplianceControl = {
    id : Nat;
    frameworkId : Nat;
    controlId : Text;
    controlName : Text;
    description : Text;
    status : ControlStatus;
    evidence : Text;
    owner : Text;
    updatedAt : Int;
  };

  type CreateComplianceControlInput = {
    frameworkId : Nat;
    controlId : Text;
    controlName : Text;
    description : Text;
    status : ControlStatus;
    evidence : Text;
    owner : Text;
  };

  type UpdateComplianceControlInput = {
    id : Nat;
    status : ?ControlStatus;
    evidence : ?Text;
    owner : ?Text;
  };

  type ComplianceScores = {
    frameworkName : Text;
    score : Nat;
    total : Nat;
    implemented : Nat;
  };

  // Tenant Types and State
  public type Tenant = {
    id : Nat;
    name : Text;
    domain : Text;
    ownerPrincipal : Principal;
    createdAt : Int;
  };

  public type TenantCreateInput = {
    name : Text;
    domain : Text;
  };

  var nextTenantId = 1;
  let tenants = Map.empty<Nat, Tenant>();
  let userTenantMap = Map.empty<Principal, Nat>();

  let documents = Map.empty<Nat, Document>();
  var nextDocumentId = 1;

  let risks = Map.empty<Nat, RiskItem>();
  var nextRiskId = 1;

  let governanceItems = Map.empty<Nat, GovernanceItem>();
  var nextGovernanceId = 1;

  let frameworks = Map.empty<Nat, ComplianceFramework>();
  var nextFrameworkId = 1;

  let controls = Map.empty<Nat, ComplianceControl>();
  var nextControlId = 1;

  // Tenant association maps (separate to avoid stable-type migration issues)
  let govTenantMap = Map.empty<Nat, Nat>();
  let ctrlTenantMap = Map.empty<Nat, Nat>();
  let docTenantMap = Map.empty<Nat, Nat>();

  // Helper Functions
  func getCurrentTime() : Int {
    Time.now();
  };

  func determineRiskLevel(score : Nat) : RiskLevel {
    if (score <= 6) { #low } else if (score <= 12) { #medium } else if (score <= 19) {
      #high;
    } else { #critical };
  };

  func getMaturityLevelValue(level : MaturityLevel) : Nat {
    switch (level) {
      case (#critical) { 1 };
      case (#high) { 2 };
      case (#medium) { 3 };
      case (#low) { 4 };
      case (#veryLow) { 5 };
    };
  };

  func calculateResidualRiskScore(inherentScore : Nat, controls : [MitigationControl]) : Nat {
    if (controls.size() == 0) { return inherentScore };

    var minMaturity = 5;
    for (control in controls.values()) {
      let controlValue = getMaturityLevelValue(control.maturityLevel);
      if (controlValue < minMaturity) {
        minMaturity := controlValue;
      };
    };

    inherentScore * minMaturity;
  };

  func getCallerTenantId(caller : Principal) : Nat {
    switch (userTenantMap.get(caller)) {
      case (null) { 0 };
      case (?tenantId) { tenantId };
    };
  };

  // Tenant Management
  public shared ({ caller }) func createTenant(input : TenantCreateInput) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create tenants");
    };

    let id = nextTenantId;
    let tenant : Tenant = {
      id;
      name = input.name;
      domain = input.domain;
      ownerPrincipal = caller;
      createdAt = getCurrentTime();
    };

    tenants.add(id, tenant);
    nextTenantId += 1;
    id;
  };

  public query ({ caller }) func listTenants() : async [Tenant] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view tenants");
    };
    tenants.values().toArray();
  };

  public shared ({ caller }) func deleteTenant(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete tenants");
    };

    switch (tenants.get(id)) {
      case (null) { Runtime.trap("Tenant not found") };
      case (?_) {
        tenants.remove(id);
      };
    };
  };

  public shared ({ caller }) func assignUserToTenant(user : Principal, tenantId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can assign tenants");
    };

    switch (tenants.get(tenantId)) {
      case (null) { Runtime.trap("Tenant not found") };
      case (?_) {
        userTenantMap.add(user, tenantId);
      };
    };
  };

  public query ({ caller }) func getCallerTenant() : async ?Tenant {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can view tenant information");
    };

    switch (userTenantMap.get(caller)) {
      case (null) { null };
      case (?tenantId) { tenants.get(tenantId) };
    };
  };

  public query ({ caller }) func getUserTenant(user : Principal) : async ?Tenant {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view users' tenants");
    };

    switch (userTenantMap.get(user)) {
      case (null) { null };
      case (?tenantId) { tenants.get(tenantId) };
    };
  };

  // Repository Initialization
  public shared ({ caller }) func initializeISMSRepository() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    let seeds : [CreateDocumentInput] = [
      {
        title = "Scope of ISMS";
        clauseNumber = "4.3";
        clauseName = "Context of the Organization";
        controlNumber = "";
        controlName = "";
        description = "Defines the scope of the Information Security Management System";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = false;
      },
    ];

    for (seed in seeds.values()) {
      let doc : Document = {
        id = nextDocumentId;
        title = seed.title;
        clauseNumber = seed.clauseNumber;
        clauseName = seed.clauseName;
        controlNumber = seed.controlNumber;
        controlName = seed.controlName;
        description = seed.description;
        status = #notStarted;
        owner = seed.owner;
        createdAt = getCurrentTime();
        updatedAt = getCurrentTime();
        fileId = null;
        isAnnexA = seed.isAnnexA;
      };

      documents.add(nextDocumentId, doc);
      nextDocumentId += 1;
    };
  };

  public shared ({ caller }) func initializeGRCData() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    // Framework Seeds
    let frameworkSeeds : [ComplianceFramework] = [
      { id = 1; name = "ISO 27001:2022"; description = "Information Security Management System Standard"; version = "2022" },
      { id = 2; name = "SOC 2 Type II"; description = "Service Organization Control Reports"; version = "Type II" },
      { id = 3; name = "GDPR"; description = "General Data Protection Regulation"; version = "2018" },
      { id = 4; name = "PCI DSS v4.0"; description = "Payment Card Industry Data Security Standard"; version = "4.0" },
      { id = 5; name = "NIST CSF 2.0"; description = "Cybersecurity Framework 2.0"; version = "2.0" },
      { id = 6; name = "ISO 9001:2015"; description = "Quality Management Systems"; version = "2015" },
    ];

    for (framework in frameworkSeeds.values()) {
      frameworks.add(framework.id, framework);
      nextFrameworkId := framework.id + 1;
    };

    // Control Seeds
    // Control Seeds - Complete listing for all frameworks
    let controlSeeds : [ComplianceControl] = [
      // ── ISO 27001:2022 ── Framework ID 1 ──────────────────────────────────
      // A.5 Organizational controls (37 controls)
      { id = 1; frameworkId = 1; controlId = "A.5.1"; controlName = "Policies for information security"; description = "A set of information security policies and topic-specific policies shall be defined, approved, published, communicated to and acknowledged by relevant personnel."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 2; frameworkId = 1; controlId = "A.5.2"; controlName = "Information security roles and responsibilities"; description = "Information security roles and responsibilities shall be defined and allocated."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 3; frameworkId = 1; controlId = "A.5.3"; controlName = "Segregation of duties"; description = "Conflicting duties and conflicting areas of responsibility shall be segregated."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 4; frameworkId = 1; controlId = "A.5.4"; controlName = "Management responsibilities"; description = "Management shall require all personnel to apply information security in accordance with established policies, topic-specific policies and procedures."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 5; frameworkId = 1; controlId = "A.5.5"; controlName = "Contact with authorities"; description = "The organization shall establish and maintain contact with relevant authorities."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 6; frameworkId = 1; controlId = "A.5.6"; controlName = "Contact with special interest groups"; description = "The organization shall establish and maintain contact with special interest groups or other specialist security forums and professional associations."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 7; frameworkId = 1; controlId = "A.5.7"; controlName = "Threat intelligence"; description = "Information relating to information security threats shall be collected and analysed to produce threat intelligence."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 8; frameworkId = 1; controlId = "A.5.8"; controlName = "Information security in project management"; description = "Information security shall be integrated into project management."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 9; frameworkId = 1; controlId = "A.5.9"; controlName = "Inventory of information and other associated assets"; description = "An inventory of information and other associated assets, including owners, shall be developed and maintained."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 10; frameworkId = 1; controlId = "A.5.10"; controlName = "Acceptable use of information and other associated assets"; description = "Rules for the acceptable use and procedures for handling information and other associated assets shall be identified, documented and implemented."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 11; frameworkId = 1; controlId = "A.5.11"; controlName = "Return of assets"; description = "Personnel and other interested parties as appropriate shall return all the organization's assets in their possession upon change or termination of their employment, contract or agreement."; status = #notImplemented; evidence = ""; owner = "HR"; updatedAt = getCurrentTime() },
      { id = 12; frameworkId = 1; controlId = "A.5.12"; controlName = "Classification of information"; description = "Information shall be classified according to the information security needs of the organization based on confidentiality, integrity, availability and relevant interested party requirements."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 13; frameworkId = 1; controlId = "A.5.13"; controlName = "Labelling of information"; description = "An appropriate set of procedures for information labelling shall be developed and implemented in accordance with the information classification scheme adopted by the organization."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 14; frameworkId = 1; controlId = "A.5.14"; controlName = "Information transfer"; description = "Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organization and between the organization and other parties."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 15; frameworkId = 1; controlId = "A.5.15"; controlName = "Access control"; description = "Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 16; frameworkId = 1; controlId = "A.5.16"; controlName = "Identity management"; description = "The full life cycle of identities shall be managed."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 17; frameworkId = 1; controlId = "A.5.17"; controlName = "Authentication information"; description = "Allocation and management of authentication information shall be controlled by a management process, including advising personnel on appropriate handling of authentication information."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 18; frameworkId = 1; controlId = "A.5.18"; controlName = "Access rights"; description = "Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed in accordance with the organization's topic-specific policy on and rules for access control."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 19; frameworkId = 1; controlId = "A.5.19"; controlName = "Information security in supplier relationships"; description = "Processes and procedures shall be defined and implemented to manage the information security risks associated with the use of supplier's products or services."; status = #notImplemented; evidence = ""; owner = "Procurement"; updatedAt = getCurrentTime() },
      { id = 20; frameworkId = 1; controlId = "A.5.20"; controlName = "Addressing information security within supplier agreements"; description = "Relevant information security requirements shall be established and agreed with each supplier based on the type of supplier relationship."; status = #notImplemented; evidence = ""; owner = "Procurement"; updatedAt = getCurrentTime() },
      { id = 21; frameworkId = 1; controlId = "A.5.21"; controlName = "Managing information security in the ICT supply chain"; description = "Processes and procedures shall be defined and implemented to manage the information security risks associated with the ICT products and services supply chain."; status = #notImplemented; evidence = ""; owner = "Procurement"; updatedAt = getCurrentTime() },
      { id = 22; frameworkId = 1; controlId = "A.5.22"; controlName = "Monitoring, review and change management of supplier services"; description = "The organization shall regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery."; status = #notImplemented; evidence = ""; owner = "Procurement"; updatedAt = getCurrentTime() },
      { id = 23; frameworkId = 1; controlId = "A.5.23"; controlName = "Information security for use of cloud services"; description = "Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization's information security requirements."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 24; frameworkId = 1; controlId = "A.5.24"; controlName = "Information security incident management planning and preparation"; description = "The organization shall plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 25; frameworkId = 1; controlId = "A.5.25"; controlName = "Assessment and decision on information security events"; description = "The organization shall assess information security events and decide if they are to be categorized as information security incidents."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 26; frameworkId = 1; controlId = "A.5.26"; controlName = "Response to information security incidents"; description = "Information security incidents shall be responded to in accordance with the documented procedures."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 27; frameworkId = 1; controlId = "A.5.27"; controlName = "Learning from information security incidents"; description = "Knowledge gained from information security incidents shall be used to strengthen and improve the information security controls."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 28; frameworkId = 1; controlId = "A.5.28"; controlName = "Collection of evidence"; description = "The organization shall establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information security events."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 29; frameworkId = 1; controlId = "A.5.29"; controlName = "Information security during disruption"; description = "The organization shall plan how to maintain information security at an appropriate level during disruption."; status = #notImplemented; evidence = ""; owner = "BCM Manager"; updatedAt = getCurrentTime() },
      { id = 30; frameworkId = 1; controlId = "A.5.30"; controlName = "ICT readiness for business continuity"; description = "ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements."; status = #notImplemented; evidence = ""; owner = "BCM Manager"; updatedAt = getCurrentTime() },
      { id = 31; frameworkId = 1; controlId = "A.5.31"; controlName = "Legal, statutory, regulatory and contractual requirements"; description = "Legal, statutory, regulatory and contractual requirements relevant to information security and the organization's approach to meet these requirements shall be identified, documented and kept up to date."; status = #notImplemented; evidence = ""; owner = "Legal"; updatedAt = getCurrentTime() },
      { id = 32; frameworkId = 1; controlId = "A.5.32"; controlName = "Intellectual property rights"; description = "The organization shall implement appropriate procedures to protect intellectual property rights."; status = #notImplemented; evidence = ""; owner = "Legal"; updatedAt = getCurrentTime() },
      { id = 33; frameworkId = 1; controlId = "A.5.33"; controlName = "Protection of records"; description = "Records shall be protected from loss, destruction, falsification, unauthorized access and unauthorized release."; status = #notImplemented; evidence = ""; owner = "Legal"; updatedAt = getCurrentTime() },
      { id = 34; frameworkId = 1; controlId = "A.5.34"; controlName = "Privacy and protection of PII"; description = "The organization shall identify and meet the requirements regarding the preservation of privacy and protection of PII according to applicable laws and regulations and contractual requirements."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 35; frameworkId = 1; controlId = "A.5.35"; controlName = "Independent review of information security"; description = "The organization's approach to managing information security and its implementation including people, processes and technologies shall be reviewed independently at planned intervals or when significant changes occur."; status = #notImplemented; evidence = ""; owner = "Internal Audit"; updatedAt = getCurrentTime() },
      { id = 36; frameworkId = 1; controlId = "A.5.36"; controlName = "Compliance with policies, rules and standards for information security"; description = "Compliance with the organization's information security policy, topic-specific policies, rules and standards shall be regularly reviewed."; status = #notImplemented; evidence = ""; owner = "Internal Audit"; updatedAt = getCurrentTime() },
      { id = 37; frameworkId = 1; controlId = "A.5.37"; controlName = "Documented operating procedures"; description = "Operating procedures for information processing facilities shall be documented and made available to personnel who need them."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      // A.6 People controls (8 controls)
      { id = 38; frameworkId = 1; controlId = "A.6.1"; controlName = "Screening"; description = "Background verification checks on all candidates to become personnel shall be carried out prior to joining the organization and on an ongoing basis."; status = #notImplemented; evidence = ""; owner = "HR"; updatedAt = getCurrentTime() },
      { id = 39; frameworkId = 1; controlId = "A.6.2"; controlName = "Terms and conditions of employment"; description = "The employment contractual agreements shall state the personnel's and the organization's responsibilities for information security."; status = #notImplemented; evidence = ""; owner = "HR"; updatedAt = getCurrentTime() },
      { id = 40; frameworkId = 1; controlId = "A.6.3"; controlName = "Information security awareness, education and training"; description = "Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization's information security policy."; status = #notImplemented; evidence = ""; owner = "HR"; updatedAt = getCurrentTime() },
      { id = 41; frameworkId = 1; controlId = "A.6.4"; controlName = "Disciplinary process"; description = "A disciplinary process shall be formalized and communicated to take actions against personnel and other relevant interested parties who have committed an information security policy violation."; status = #notImplemented; evidence = ""; owner = "HR"; updatedAt = getCurrentTime() },
      { id = 42; frameworkId = 1; controlId = "A.6.5"; controlName = "Responsibilities after termination or change of employment"; description = "Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated to relevant personnel and other interested parties."; status = #notImplemented; evidence = ""; owner = "HR"; updatedAt = getCurrentTime() },
      { id = 43; frameworkId = 1; controlId = "A.6.6"; controlName = "Confidentiality or non-disclosure agreements"; description = "Confidentiality or non-disclosure agreements reflecting the organization's needs for the protection of information shall be identified, documented, regularly reviewed and signed by personnel and other relevant interested parties."; status = #notImplemented; evidence = ""; owner = "Legal"; updatedAt = getCurrentTime() },
      { id = 44; frameworkId = 1; controlId = "A.6.7"; controlName = "Remote working"; description = "Security measures shall be implemented when personnel are working remotely to protect information accessed, processed or stored outside the organization's premises."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 45; frameworkId = 1; controlId = "A.6.8"; controlName = "Information security event reporting"; description = "The organization shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      // A.7 Physical controls (14 controls)
      { id = 46; frameworkId = 1; controlId = "A.7.1"; controlName = "Physical security perimeters"; description = "Security perimeters shall be defined and used to protect areas that contain information and other associated assets."; status = #notImplemented; evidence = ""; owner = "Facilities Manager"; updatedAt = getCurrentTime() },
      { id = 47; frameworkId = 1; controlId = "A.7.2"; controlName = "Physical entry"; description = "Secure areas shall be protected by appropriate entry controls and access points."; status = #notImplemented; evidence = ""; owner = "Facilities Manager"; updatedAt = getCurrentTime() },
      { id = 48; frameworkId = 1; controlId = "A.7.3"; controlName = "Securing offices, rooms and facilities"; description = "Physical security for offices, rooms and facilities shall be designed and implemented."; status = #notImplemented; evidence = ""; owner = "Facilities Manager"; updatedAt = getCurrentTime() },
      { id = 49; frameworkId = 1; controlId = "A.7.4"; controlName = "Physical security monitoring"; description = "Premises shall be continuously monitored for unauthorized physical access."; status = #notImplemented; evidence = ""; owner = "Facilities Manager"; updatedAt = getCurrentTime() },
      { id = 50; frameworkId = 1; controlId = "A.7.5"; controlName = "Protecting against physical and environmental threats"; description = "Protection against physical and environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure shall be designed and implemented."; status = #notImplemented; evidence = ""; owner = "Facilities Manager"; updatedAt = getCurrentTime() },
      { id = 51; frameworkId = 1; controlId = "A.7.6"; controlName = "Working in secure areas"; description = "Security measures for working in secure areas shall be designed and implemented."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 52; frameworkId = 1; controlId = "A.7.7"; controlName = "Clear desk and clear screen"; description = "Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities shall be defined and appropriately enforced."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 53; frameworkId = 1; controlId = "A.7.8"; controlName = "Equipment siting and protection"; description = "Equipment shall be sited securely and protected."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 54; frameworkId = 1; controlId = "A.7.9"; controlName = "Security of assets off-premises"; description = "Off-site assets shall be protected."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 55; frameworkId = 1; controlId = "A.7.10"; controlName = "Storage media"; description = "Storage media shall be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organization's classification scheme and handling requirements."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 56; frameworkId = 1; controlId = "A.7.11"; controlName = "Supporting utilities"; description = "Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities."; status = #notImplemented; evidence = ""; owner = "Facilities Manager"; updatedAt = getCurrentTime() },
      { id = 57; frameworkId = 1; controlId = "A.7.12"; controlName = "Cabling security"; description = "Cables carrying power, data or supporting information services shall be protected from interception, interference or damage."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 58; frameworkId = 1; controlId = "A.7.13"; controlName = "Equipment maintenance"; description = "Equipment shall be maintained correctly to ensure availability, integrity and confidentiality of information."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 59; frameworkId = 1; controlId = "A.7.14"; controlName = "Secure disposal or re-use of equipment"; description = "Items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      // A.8 Technological controls (34 controls)
      { id = 60; frameworkId = 1; controlId = "A.8.1"; controlName = "User endpoint devices"; description = "Information stored on, processed by or accessible via user endpoint devices shall be protected."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 61; frameworkId = 1; controlId = "A.8.2"; controlName = "Privileged access rights"; description = "The allocation and use of privileged access rights shall be restricted and managed."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 62; frameworkId = 1; controlId = "A.8.3"; controlName = "Information access restriction"; description = "Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 63; frameworkId = 1; controlId = "A.8.4"; controlName = "Access to source code"; description = "Read and write access to source code, development tools and software libraries shall be appropriately managed."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 64; frameworkId = 1; controlId = "A.8.5"; controlName = "Secure authentication"; description = "Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 65; frameworkId = 1; controlId = "A.8.6"; controlName = "Capacity management"; description = "The use of resources shall be monitored and adjusted in line with current and expected capacity requirements."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 66; frameworkId = 1; controlId = "A.8.7"; controlName = "Protection against malware"; description = "Protection against malware shall be implemented and supported by appropriate user awareness."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 67; frameworkId = 1; controlId = "A.8.8"; controlName = "Management of technical vulnerabilities"; description = "Information about technical vulnerabilities of information systems in use shall be obtained in a timely fashion, the organization's exposure to such vulnerabilities evaluated and appropriate measures taken."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 68; frameworkId = 1; controlId = "A.8.9"; controlName = "Configuration management"; description = "Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 69; frameworkId = 1; controlId = "A.8.10"; controlName = "Information deletion"; description = "Information stored in information systems, devices or in any other storage media shall be deleted when no longer required."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 70; frameworkId = 1; controlId = "A.8.11"; controlName = "Data masking"; description = "Data masking shall be used in accordance with the organization's topic-specific policy on access control and other related topic-specific policies, and business requirements."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 71; frameworkId = 1; controlId = "A.8.12"; controlName = "Data leakage prevention"; description = "Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 72; frameworkId = 1; controlId = "A.8.13"; controlName = "Information backup"; description = "Backup copies of information, software and systems shall be maintained and regularly tested in accordance with the agreed topic-specific policy on backup."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 73; frameworkId = 1; controlId = "A.8.14"; controlName = "Redundancy of information processing facilities"; description = "Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 74; frameworkId = 1; controlId = "A.8.15"; controlName = "Logging"; description = "Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 75; frameworkId = 1; controlId = "A.8.16"; controlName = "Monitoring activities"; description = "Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents."; status = #notImplemented; evidence = ""; owner = "SOC"; updatedAt = getCurrentTime() },
      { id = 76; frameworkId = 1; controlId = "A.8.17"; controlName = "Clock synchronization"; description = "The clocks of information processing systems used by the organization shall be synchronized to approved time sources."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 77; frameworkId = 1; controlId = "A.8.18"; controlName = "Use of privileged utility programs"; description = "The use of utility programs that might be capable of overriding system and application controls shall be restricted and tightly controlled."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 78; frameworkId = 1; controlId = "A.8.19"; controlName = "Installation of software on operational systems"; description = "Procedures and measures shall be implemented to securely manage software installation on operational systems."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 79; frameworkId = 1; controlId = "A.8.20"; controlName = "Networks security"; description = "Networks and network devices shall be secured, managed and controlled to protect information in systems and applications."; status = #notImplemented; evidence = ""; owner = "Network Admin"; updatedAt = getCurrentTime() },
      { id = 80; frameworkId = 1; controlId = "A.8.21"; controlName = "Security of network services"; description = "Security mechanisms, service levels and service requirements of network services shall be identified, implemented and monitored."; status = #notImplemented; evidence = ""; owner = "Network Admin"; updatedAt = getCurrentTime() },
      { id = 81; frameworkId = 1; controlId = "A.8.22"; controlName = "Segregation of networks"; description = "Groups of information services, users and information systems shall be segregated in the organization's networks."; status = #notImplemented; evidence = ""; owner = "Network Admin"; updatedAt = getCurrentTime() },
      { id = 82; frameworkId = 1; controlId = "A.8.23"; controlName = "Web filtering"; description = "Access to external websites shall be managed to reduce exposure to malicious content."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 83; frameworkId = 1; controlId = "A.8.24"; controlName = "Use of cryptography"; description = "Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 84; frameworkId = 1; controlId = "A.8.25"; controlName = "Secure development life cycle"; description = "Rules for the secure development of software and systems shall be established and applied."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 85; frameworkId = 1; controlId = "A.8.26"; controlName = "Application security requirements"; description = "Information security requirements shall be identified, specified and approved when developing or acquiring applications."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 86; frameworkId = 1; controlId = "A.8.27"; controlName = "Secure system architecture and engineering principles"; description = "Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development activities."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 87; frameworkId = 1; controlId = "A.8.28"; controlName = "Secure coding"; description = "Secure coding principles shall be applied to software development."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 88; frameworkId = 1; controlId = "A.8.29"; controlName = "Security testing in development and acceptance"; description = "Security testing processes shall be defined and implemented in the development life cycle."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 89; frameworkId = 1; controlId = "A.8.30"; controlName = "Outsourced development"; description = "The organization shall direct, monitor and review the activities related to outsourced system development."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 90; frameworkId = 1; controlId = "A.8.31"; controlName = "Separation of development, test and production environments"; description = "Development, testing and production environments shall be separated and secured."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 91; frameworkId = 1; controlId = "A.8.32"; controlName = "Change management"; description = "Changes to information processing facilities and information systems shall be subject to change management procedures."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 92; frameworkId = 1; controlId = "A.8.33"; controlName = "Test information"; description = "Test information shall be appropriately selected, protected and managed."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 93; frameworkId = 1; controlId = "A.8.34"; controlName = "Protection of information systems during audit testing"; description = "Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management."; status = #notImplemented; evidence = ""; owner = "Internal Audit"; updatedAt = getCurrentTime() },

      // ── SOC 2 Type II ── Framework ID 2 ───────────────────────────────────
      // CC1: Control Environment
      { id = 94; frameworkId = 2; controlId = "CC1.1"; controlName = "COSO Principle 1 – Integrity and Ethical Values"; description = "The entity demonstrates a commitment to integrity and ethical values."; status = #notImplemented; evidence = ""; owner = "Executive Management"; updatedAt = getCurrentTime() },
      { id = 95; frameworkId = 2; controlId = "CC1.2"; controlName = "COSO Principle 2 – Board Oversight"; description = "The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control."; status = #notImplemented; evidence = ""; owner = "Board"; updatedAt = getCurrentTime() },
      { id = 96; frameworkId = 2; controlId = "CC1.3"; controlName = "COSO Principle 3 – Organizational Structure"; description = "Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities in the pursuit of objectives."; status = #notImplemented; evidence = ""; owner = "Executive Management"; updatedAt = getCurrentTime() },
      { id = 97; frameworkId = 2; controlId = "CC1.4"; controlName = "COSO Principle 4 – Competence"; description = "The entity demonstrates a commitment to attract, develop, and retain competent individuals in alignment with objectives."; status = #notImplemented; evidence = ""; owner = "HR"; updatedAt = getCurrentTime() },
      { id = 98; frameworkId = 2; controlId = "CC1.5"; controlName = "COSO Principle 5 – Accountability"; description = "The entity holds individuals accountable for their internal control responsibilities in the pursuit of objectives."; status = #notImplemented; evidence = ""; owner = "Executive Management"; updatedAt = getCurrentTime() },
      // CC2: Communication and Information
      { id = 99; frameworkId = 2; controlId = "CC2.1"; controlName = "COSO Principle 13 – Uses Relevant Information"; description = "The entity obtains or generates and uses relevant, quality information to support the functioning of internal control."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 100; frameworkId = 2; controlId = "CC2.2"; controlName = "COSO Principle 14 – Internal Communication"; description = "The entity internally communicates information, including objectives and responsibilities for internal control, necessary to support the functioning of internal control."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 101; frameworkId = 2; controlId = "CC2.3"; controlName = "COSO Principle 15 – External Communication"; description = "The entity communicates with external parties regarding matters affecting the functioning of internal control."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      // CC3: Risk Assessment
      { id = 102; frameworkId = 2; controlId = "CC3.1"; controlName = "COSO Principle 6 – Specifies Objectives"; description = "The entity specifies objectives with sufficient clarity to enable the identification and assessment of risks relating to objectives."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      { id = 103; frameworkId = 2; controlId = "CC3.2"; controlName = "COSO Principle 7 – Identifies and Analyzes Risk"; description = "The entity identifies risks to the achievement of its objectives across the entity and analyzes risks as a basis for determining how the risks should be managed."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      { id = 104; frameworkId = 2; controlId = "CC3.3"; controlName = "COSO Principle 8 – Assesses Fraud Risk"; description = "The entity considers the potential for fraud in assessing risks to the achievement of objectives."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      { id = 105; frameworkId = 2; controlId = "CC3.4"; controlName = "COSO Principle 9 – Identifies and Analyzes Significant Change"; description = "The entity identifies and assesses changes that could significantly impact the system of internal control."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      // CC4: Monitoring Activities
      { id = 106; frameworkId = 2; controlId = "CC4.1"; controlName = "COSO Principle 16 – Conducts Ongoing Evaluations"; description = "The entity selects, develops, and performs ongoing and/or separate evaluations to ascertain whether the components of internal control are present and functioning."; status = #notImplemented; evidence = ""; owner = "Internal Audit"; updatedAt = getCurrentTime() },
      { id = 107; frameworkId = 2; controlId = "CC4.2"; controlName = "COSO Principle 17 – Evaluates and Communicates Deficiencies"; description = "The entity evaluates and communicates internal control deficiencies in a timely manner to those parties responsible for taking corrective action."; status = #notImplemented; evidence = ""; owner = "Internal Audit"; updatedAt = getCurrentTime() },
      // CC5: Control Activities
      { id = 108; frameworkId = 2; controlId = "CC5.1"; controlName = "COSO Principle 10 – Selects and Develops Control Activities"; description = "The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 109; frameworkId = 2; controlId = "CC5.2"; controlName = "COSO Principle 11 – Technology General Controls"; description = "The entity also selects and develops general control activities over technology to support the achievement of objectives."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 110; frameworkId = 2; controlId = "CC5.3"; controlName = "COSO Principle 12 – Deploys Through Policies and Procedures"; description = "The entity deploys control activities through policies that establish what is expected and in procedures that put policies into action."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      // CC6: Logical and Physical Access
      { id = 111; frameworkId = 2; controlId = "CC6.1"; controlName = "Logical Access Security Software"; description = "The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events."; status = #notImplemented; evidence = ""; owner = "Security Team"; updatedAt = getCurrentTime() },
      { id = 112; frameworkId = 2; controlId = "CC6.2"; controlName = "Registration and Authorization of Users"; description = "Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 113; frameworkId = 2; controlId = "CC6.3"; controlName = "Role-Based Access Controls"; description = "The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 114; frameworkId = 2; controlId = "CC6.4"; controlName = "Physical Access Restrictions"; description = "The entity restricts physical access to facilities and protected information assets to authorized personnel."; status = #notImplemented; evidence = ""; owner = "Facilities Manager"; updatedAt = getCurrentTime() },
      { id = 115; frameworkId = 2; controlId = "CC6.5"; controlName = "Logical Access Security Measures"; description = "The entity discontinues logical and physical protections over physical assets only after the ability to read or recover data and software from those assets has been diminished."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 116; frameworkId = 2; controlId = "CC6.6"; controlName = "Security Measures Against Threats"; description = "The entity implements logical access security measures to protect against threats from sources outside its system boundaries."; status = #notImplemented; evidence = ""; owner = "Security Team"; updatedAt = getCurrentTime() },
      { id = 117; frameworkId = 2; controlId = "CC6.7"; controlName = "Transmission and Receipt of Data"; description = "The entity restricts the transmission, movement, and removal of information to authorized internal and external users."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 118; frameworkId = 2; controlId = "CC6.8"; controlName = "Prevention and Detection of Unauthorized Software"; description = "The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      // CC7: System Operations
      { id = 119; frameworkId = 2; controlId = "CC7.1"; controlName = "Configuration Management"; description = "To meet its objectives, the entity uses detection and monitoring procedures to identify changes to configurations or software."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 120; frameworkId = 2; controlId = "CC7.2"; controlName = "Anomaly and Threat Detection"; description = "The entity designs detection measures to identify anomalies that could result in, or indicate that, a security, availability, processing integrity, confidentiality, or privacy event has occurred."; status = #notImplemented; evidence = ""; owner = "SOC"; updatedAt = getCurrentTime() },
      { id = 121; frameworkId = 2; controlId = "CC7.3"; controlName = "Evaluation and Response to Threats"; description = "The entity evaluates security events to determine whether they could or have resulted in a failure of the entity to meet its objectives and, if so, takes actions to prevent or address such failures."; status = #notImplemented; evidence = ""; owner = "SOC"; updatedAt = getCurrentTime() },
      { id = 122; frameworkId = 2; controlId = "CC7.4"; controlName = "Incident Response"; description = "The entity responds to identified security incidents by executing a defined incident response program to understand, contain, remediate, and communicate security incidents."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 123; frameworkId = 2; controlId = "CC7.5"; controlName = "Restoration of Operations"; description = "The entity identifies, develops, and implements activities to recover from identified security incidents."; status = #notImplemented; evidence = ""; owner = "BCM Manager"; updatedAt = getCurrentTime() },
      // CC8: Change Management
      { id = 124; frameworkId = 2; controlId = "CC8.1"; controlName = "Change Management Process"; description = "The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      // CC9: Risk Mitigation
      { id = 125; frameworkId = 2; controlId = "CC9.1"; controlName = "Risk Mitigation Activities"; description = "The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      { id = 126; frameworkId = 2; controlId = "CC9.2"; controlName = "Vendor and Business Partner Risk Management"; description = "The entity assesses and manages risks associated with vendors and business partners."; status = #notImplemented; evidence = ""; owner = "Procurement"; updatedAt = getCurrentTime() },
      // A1: Availability
      { id = 127; frameworkId = 2; controlId = "A1.1"; controlName = "Availability Objectives"; description = "The entity maintains, monitors, and evaluates current processing capacity and use of system components to manage capacity demand."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 128; frameworkId = 2; controlId = "A1.2"; controlName = "Environmental Threat Protection"; description = "The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections."; status = #notImplemented; evidence = ""; owner = "Facilities Manager"; updatedAt = getCurrentTime() },
      { id = 129; frameworkId = 2; controlId = "A1.3"; controlName = "Recovery Plan Testing"; description = "The entity tests recovery plan procedures supporting system recovery."; status = #notImplemented; evidence = ""; owner = "BCM Manager"; updatedAt = getCurrentTime() },
      // C1: Confidentiality
      { id = 130; frameworkId = 2; controlId = "C1.1"; controlName = "Identification of Confidential Information"; description = "The entity identifies and maintains confidential information to meet the entity's objectives related to confidentiality."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 131; frameworkId = 2; controlId = "C1.2"; controlName = "Disposal of Confidential Information"; description = "The entity disposes of confidential information to meet the entity's objectives related to confidentiality."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },

      // ── GDPR ── Framework ID 3 ─────────────────────────────────────────────
      { id = 132; frameworkId = 3; controlId = "Art. 5"; controlName = "Principles relating to processing of personal data"; description = "Personal data shall be processed lawfully, fairly and in a transparent manner; collected for specified, explicit and legitimate purposes; adequate, relevant and limited to what is necessary; accurate and kept up to date; not kept longer than necessary; processed with appropriate security."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 133; frameworkId = 3; controlId = "Art. 6"; controlName = "Lawfulness of processing"; description = "Processing shall be lawful only if and to the extent that at least one of the following applies: consent, contract, legal obligation, vital interests, public task, or legitimate interests."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 134; frameworkId = 3; controlId = "Art. 7"; controlName = "Conditions for consent"; description = "Where processing is based on consent, the controller shall be able to demonstrate that the data subject has consented to processing of his or her personal data."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 135; frameworkId = 3; controlId = "Art. 9"; controlName = "Processing of special categories of personal data"; description = "Processing of special categories of data (revealing racial or ethnic origin, political opinions, religious beliefs, etc.) shall be prohibited unless specific conditions are met."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 136; frameworkId = 3; controlId = "Art. 12"; controlName = "Transparent information and communication"; description = "The controller shall take appropriate measures to provide information relating to processing to the data subject in a concise, transparent, intelligible and easily accessible form."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 137; frameworkId = 3; controlId = "Art. 13"; controlName = "Information to be provided – data collected from data subject"; description = "Where personal data relating to a data subject are collected from the data subject, the controller shall provide specific information at the time of collection."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 138; frameworkId = 3; controlId = "Art. 14"; controlName = "Information to be provided – data not obtained from data subject"; description = "Where personal data have not been obtained from the data subject, the controller shall provide the data subject with specified information."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 139; frameworkId = 3; controlId = "Art. 15"; controlName = "Right of access by the data subject"; description = "The data subject shall have the right to obtain from the controller confirmation as to whether or not personal data concerning him or her are being processed, and other relevant information."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 140; frameworkId = 3; controlId = "Art. 16"; controlName = "Right to rectification"; description = "The data subject shall have the right to obtain from the controller without undue delay the rectification of inaccurate personal data concerning him or her."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 141; frameworkId = 3; controlId = "Art. 17"; controlName = "Right to erasure (right to be forgotten)"; description = "The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay under specified circumstances."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 142; frameworkId = 3; controlId = "Art. 18"; controlName = "Right to restriction of processing"; description = "The data subject shall have the right to obtain from the controller restriction of processing in certain circumstances."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 143; frameworkId = 3; controlId = "Art. 20"; controlName = "Right to data portability"; description = "The data subject shall have the right to receive personal data concerning him or her in a structured, commonly used and machine-readable format."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 144; frameworkId = 3; controlId = "Art. 21"; controlName = "Right to object"; description = "The data subject shall have the right to object to processing of personal data concerning him or her based on legitimate interests or for direct marketing purposes."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 145; frameworkId = 3; controlId = "Art. 22"; controlName = "Automated individual decision-making"; description = "The data subject shall have the right not to be subject to a decision based solely on automated processing, including profiling."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 146; frameworkId = 3; controlId = "Art. 24"; controlName = "Responsibility of the controller"; description = "The controller shall implement appropriate technical and organisational measures to ensure and be able to demonstrate that processing is performed in accordance with GDPR."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 147; frameworkId = 3; controlId = "Art. 25"; controlName = "Data protection by design and by default"; description = "The controller shall implement appropriate technical and organisational measures for ensuring that, by default, only personal data which are necessary for each specific purpose are processed."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 148; frameworkId = 3; controlId = "Art. 26"; controlName = "Joint controllers"; description = "Where two or more controllers jointly determine the purposes and means of processing, they shall be joint controllers and shall agree on their respective responsibilities for compliance."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 149; frameworkId = 3; controlId = "Art. 28"; controlName = "Processor"; description = "Where processing is to be carried out on behalf of a controller, the controller shall only use processors providing sufficient guarantees of appropriate technical and organisational measures."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 150; frameworkId = 3; controlId = "Art. 30"; controlName = "Records of processing activities"; description = "Each controller shall maintain a record of processing activities under its responsibility."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 151; frameworkId = 3; controlId = "Art. 32"; controlName = "Security of processing"; description = "The controller and processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 152; frameworkId = 3; controlId = "Art. 33"; controlName = "Notification of personal data breach to supervisory authority"; description = "In the case of a personal data breach, the controller shall notify the supervisory authority without undue delay and, where feasible, no later than 72 hours after having become aware of it."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 153; frameworkId = 3; controlId = "Art. 34"; controlName = "Communication of personal data breach to data subject"; description = "When the personal data breach is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall communicate the breach to the data subject without undue delay."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 154; frameworkId = 3; controlId = "Art. 35"; controlName = "Data protection impact assessment"; description = "Where processing is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall carry out a data protection impact assessment prior to the processing."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 155; frameworkId = 3; controlId = "Art. 37"; controlName = "Designation of Data Protection Officer"; description = "The controller and the processor shall designate a Data Protection Officer in specified circumstances."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 156; frameworkId = 3; controlId = "Art. 44"; controlName = "General principle for transfers"; description = "Any transfer of personal data to a third country or an international organisation shall only take place if the conditions set out in Chapter V are complied with."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 157; frameworkId = 3; controlId = "Art. 46"; controlName = "Transfers subject to appropriate safeguards"; description = "In the absence of an adequacy decision, a controller or processor may transfer personal data to a third country only if appropriate safeguards have been provided."; status = #notImplemented; evidence = ""; owner = "DPO"; updatedAt = getCurrentTime() },
      { id = 158; frameworkId = 3; controlId = "Art. 83"; controlName = "General conditions for imposing administrative fines"; description = "Infringements of specified provisions of GDPR shall be subject to administrative fines up to 20,000,000 EUR, or in the case of an undertaking, up to 4% of total worldwide annual turnover."; status = #notImplemented; evidence = ""; owner = "Legal"; updatedAt = getCurrentTime() },

      // ── PCI DSS v4.0 ── Framework ID 4 ────────────────────────────────────
      { id = 159; frameworkId = 4; controlId = "Req 1.1"; controlName = "Processes and mechanisms for installing and maintaining network security controls are defined and understood"; description = "All security policies and operational procedures for installing and maintaining network security controls are documented, in use, and known to all affected parties."; status = #notImplemented; evidence = ""; owner = "Network Admin"; updatedAt = getCurrentTime() },
      { id = 160; frameworkId = 4; controlId = "Req 1.2"; controlName = "Network security controls (NSCs) are configured and maintained"; description = "Configuration standards for NSCs are developed, implemented, and maintained. Inbound and outbound traffic is restricted to only that traffic which is necessary."; status = #notImplemented; evidence = ""; owner = "Network Admin"; updatedAt = getCurrentTime() },
      { id = 161; frameworkId = 4; controlId = "Req 1.3"; controlName = "Network access to and from the cardholder data environment is restricted"; description = "All inbound and outbound network access to/from the CDE is restricted and controlled to only that which is required."; status = #notImplemented; evidence = ""; owner = "Network Admin"; updatedAt = getCurrentTime() },
      { id = 162; frameworkId = 4; controlId = "Req 2.1"; controlName = "Processes and mechanisms for applying secure configurations to all system components are defined and understood"; description = "All security policies and operational procedures for managing vendor defaults and other security parameters are documented, in use, and known to all affected parties."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 163; frameworkId = 4; controlId = "Req 2.2"; controlName = "System components are configured and managed securely"; description = "Configuration standards are developed, implemented, and maintained for all system components. All unnecessary default accounts are removed or changed."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 164; frameworkId = 4; controlId = "Req 2.3"; controlName = "Wireless environments are configured and managed securely"; description = "All wireless vendor defaults are changed at installation. Wireless networks transmitting cardholder data or connected to the CDE use industry best practices for authentication and transmission."; status = #notImplemented; evidence = ""; owner = "Network Admin"; updatedAt = getCurrentTime() },
      { id = 165; frameworkId = 4; controlId = "Req 3.1"; controlName = "Processes and mechanisms for protecting stored account data are defined and understood"; description = "All security policies and operational procedures for protecting stored cardholder data are documented, in use, and known to all affected parties."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 166; frameworkId = 4; controlId = "Req 3.2"; controlName = "Storage of account data is kept to a minimum"; description = "Data storage amount and retention time is limited to that required for legal, regulatory, and/or business requirements. Data retention and disposal policies are implemented."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 167; frameworkId = 4; controlId = "Req 3.3"; controlName = "Sensitive authentication data (SAD) is not stored after authorization"; description = "SAD is not retained after authorization, even if encrypted. All sensitive authentication data received is rendered unrecoverable upon completion of the authorization process."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 168; frameworkId = 4; controlId = "Req 3.4"; controlName = "Access to displays of full PAN and ability to copy PAN are restricted"; description = "Full PAN is only displayed to those with a legitimate business need. Displays of full PAN are masked to show only the first 6 and last 4 digits as the maximum number of digits to be displayed."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 169; frameworkId = 4; controlId = "Req 3.5"; controlName = "Primary account number (PAN) is secured wherever it is stored"; description = "PAN is secured with strong cryptography wherever it is stored. PAN is unreadable anywhere it is stored."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 170; frameworkId = 4; controlId = "Req 4.1"; controlName = "Processes and mechanisms for protecting cardholder data with strong cryptography during transmission are defined and understood"; description = "All security policies and operational procedures for encrypting transmissions of cardholder data are documented, in use, and known to all affected parties."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 171; frameworkId = 4; controlId = "Req 4.2"; controlName = "PAN is protected with strong cryptography during transmission"; description = "Strong cryptography is used to safeguard PAN during transmission over open, public networks. Trusted keys/certificates are used only. The security protocol in use only supports secure versions or configurations."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 172; frameworkId = 4; controlId = "Req 5.1"; controlName = "Processes and mechanisms for protecting all systems and networks from malicious software are defined and understood"; description = "All security policies and operational procedures for protecting systems from malware are documented, in use, and known to all affected parties."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 173; frameworkId = 4; controlId = "Req 5.2"; controlName = "Malicious software (malware) is prevented, or detected and addressed"; description = "An anti-malware solution is deployed on all system components. The anti-malware solution detects all known types of malware, generates audit logs, and performs periodic scans."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 174; frameworkId = 4; controlId = "Req 6.1"; controlName = "Processes and mechanisms for developing and maintaining secure systems and software are defined and understood"; description = "All security policies and operational procedures for developing and maintaining secure systems and software are documented, in use, and known to all affected parties."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 175; frameworkId = 4; controlId = "Req 6.2"; controlName = "Bespoke and custom software are developed securely"; description = "Bespoke and custom software are developed securely. All software developed for or by the entity adheres to applicable security requirements."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 176; frameworkId = 4; controlId = "Req 6.3"; controlName = "Security vulnerabilities are identified and addressed"; description = "Security vulnerabilities in bespoke and custom, and third-party software components are identified and addressed."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 177; frameworkId = 4; controlId = "Req 7.1"; controlName = "Processes and mechanisms for restricting access to system components and cardholder data are defined and understood"; description = "All security policies and operational procedures for restricting access to cardholder data are documented, in use, and known to all affected parties."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 178; frameworkId = 4; controlId = "Req 7.2"; controlName = "Access to system components and data is appropriately defined and assigned"; description = "All user access to system components and data is based on least privilege, with access assigned based on job classification and function."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 179; frameworkId = 4; controlId = "Req 8.1"; controlName = "Processes and mechanisms for identifying users and authenticating access to system components are defined and understood"; description = "All security policies and operational procedures for managing identifications and authentication of users are documented, in use, and known to all affected parties."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 180; frameworkId = 4; controlId = "Req 8.2"; controlName = "User identification and related accounts for users and administrators are strictly managed throughout an account's lifecycle"; description = "All user IDs and authentication credentials are managed throughout their lifecycle: adding, modifying, and deleting user accounts; managing authentication credentials."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 181; frameworkId = 4; controlId = "Req 8.3"; controlName = "User authentication for users and administrators is established and managed"; description = "All individual user accounts are authenticated with at least one of the following: something you know, something you have, or something you are. MFA is implemented for all access into the CDE."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 182; frameworkId = 4; controlId = "Req 9.1"; controlName = "Processes and mechanisms for restricting physical access to cardholder data are defined and understood"; description = "All security policies and operational procedures for restricting physical access to cardholder data are documented, in use, and known to all affected parties."; status = #notImplemented; evidence = ""; owner = "Facilities Manager"; updatedAt = getCurrentTime() },
      { id = 183; frameworkId = 4; controlId = "Req 9.2"; controlName = "Physical access controls manage entry into facilities and systems containing cardholder data"; description = "Appropriate facility entry controls are in place to limit and monitor physical access to systems in the cardholder data environment."; status = #notImplemented; evidence = ""; owner = "Facilities Manager"; updatedAt = getCurrentTime() },
      { id = 184; frameworkId = 4; controlId = "Req 10.1"; controlName = "Processes and mechanisms for logging and monitoring all access to system components and cardholder data are defined and understood"; description = "All security policies and operational procedures for monitoring all access to network resources and cardholder data are documented, in use, and known to all affected parties."; status = #notImplemented; evidence = ""; owner = "SOC"; updatedAt = getCurrentTime() },
      { id = 185; frameworkId = 4; controlId = "Req 10.2"; controlName = "Audit logs are implemented to support the detection of anomalies and suspicious activity, and the forensic analysis of events"; description = "Audit logs capture all individual user access to cardholder data, all actions by any individual with root or administrative privileges, and other specified events."; status = #notImplemented; evidence = ""; owner = "SOC"; updatedAt = getCurrentTime() },
      { id = 186; frameworkId = 4; controlId = "Req 11.1"; controlName = "Processes and mechanisms for regularly testing security of systems and networks are defined and understood"; description = "All security policies and operational procedures for monitoring and testing all access to network resources and cardholder data are documented, in use, and known to all affected parties."; status = #notImplemented; evidence = ""; owner = "Security Team"; updatedAt = getCurrentTime() },
      { id = 187; frameworkId = 4; controlId = "Req 11.3"; controlName = "External and internal vulnerabilities are regularly identified, prioritized, and addressed"; description = "Internal vulnerability scans are performed quarterly and after any significant change in the network. External vulnerability scans are performed quarterly by an Approved Scanning Vendor (ASV)."; status = #notImplemented; evidence = ""; owner = "Security Team"; updatedAt = getCurrentTime() },
      { id = 188; frameworkId = 4; controlId = "Req 11.4"; controlName = "External and internal penetration testing is regularly performed"; description = "A penetration testing methodology is defined and includes network-layer and application-layer testing. Tests are performed at least once every 12 months."; status = #notImplemented; evidence = ""; owner = "Security Team"; updatedAt = getCurrentTime() },
      { id = 189; frameworkId = 4; controlId = "Req 12.1"; controlName = "A comprehensive information security policy that governs and provides direction for protection of the entity's information assets is known and current"; description = "An overall information security policy is established, published, maintained, and disseminated to all relevant personnel and applicable vendors/business partners."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 190; frameworkId = 4; controlId = "Req 12.6"; controlName = "Security awareness education is an ongoing activity"; description = "A formal security awareness program is implemented to make all personnel aware of the cardholder data security policy and procedures. Personnel receive security awareness training upon hire and at least once every 12 months."; status = #notImplemented; evidence = ""; owner = "HR"; updatedAt = getCurrentTime() },

      // ── NIST CSF 2.0 ── Framework ID 5 ────────────────────────────────────
      // GOVERN Function
      { id = 191; frameworkId = 5; controlId = "GV.OC-01"; controlName = "Organizational Context – Mission and Objectives"; description = "The organizational mission is understood and informs cybersecurity risk management."; status = #notImplemented; evidence = ""; owner = "Executive Management"; updatedAt = getCurrentTime() },
      { id = 192; frameworkId = 5; controlId = "GV.OC-02"; controlName = "Internal Stakeholders"; description = "Internal stakeholders with cybersecurity risk management responsibilities are identified and engaged."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 193; frameworkId = 5; controlId = "GV.OC-03"; controlName = "Legal, Regulatory and Contractual Requirements"; description = "Legal, regulatory, and contractual requirements regarding cybersecurity — including privacy and civil liberties obligations — are understood and managed."; status = #notImplemented; evidence = ""; owner = "Legal"; updatedAt = getCurrentTime() },
      { id = 194; frameworkId = 5; controlId = "GV.OC-04"; controlName = "Critical Objectives and Dependencies"; description = "Critical objectives, capabilities, and services that external stakeholders depend on or expect from the organization are understood and communicated."; status = #notImplemented; evidence = ""; owner = "Executive Management"; updatedAt = getCurrentTime() },
      { id = 195; frameworkId = 5; controlId = "GV.OC-05"; controlName = "Outcomes and Risk Management"; description = "Outcomes, capabilities, and services that the organization depends on are understood and communicated."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      { id = 196; frameworkId = 5; controlId = "GV.RM-01"; controlName = "Risk Management Strategy"; description = "Risk management objectives are established and agreed to by organizational stakeholders."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      { id = 197; frameworkId = 5; controlId = "GV.RM-02"; controlName = "Risk Appetite and Tolerance"; description = "Risk appetite and risk tolerance statements are established, communicated, and maintained."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      { id = 198; frameworkId = 5; controlId = "GV.RM-03"; controlName = "Cybersecurity Risk Integrated"; description = "Cybersecurity risk management activities and outcomes are included in enterprise risk management processes."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      { id = 199; frameworkId = 5; controlId = "GV.RM-06"; controlName = "Risk Response Strategies"; description = "A standardized process for considering cybersecurity risks is established and communicated."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      { id = 200; frameworkId = 5; controlId = "GV.RR-01"; controlName = "Leadership Commitment"; description = "Organizational leadership is responsible and accountable for cybersecurity risk and fosters a culture that is risk-aware, ethical, and continually improving."; status = #notImplemented; evidence = ""; owner = "Executive Management"; updatedAt = getCurrentTime() },
      { id = 201; frameworkId = 5; controlId = "GV.RR-02"; controlName = "Roles and Responsibilities"; description = "Roles, responsibilities, and authorities related to cybersecurity risk management are established, communicated, understood, and enforced."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 202; frameworkId = 5; controlId = "GV.PO-01"; controlName = "Policy Establishment"; description = "Policy for managing cybersecurity risks is established based on organizational context, cybersecurity strategy, and priorities and is communicated and enforced."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 203; frameworkId = 5; controlId = "GV.PO-02"; controlName = "Policy Review and Update"; description = "Policy for managing cybersecurity risks is reviewed, updated, communicated, and enforced to reflect changes in requirements, threats, technology, and organizational mission."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 204; frameworkId = 5; controlId = "GV.SC-01"; controlName = "Cybersecurity Supply Chain Risk Management"; description = "A cybersecurity supply chain risk management program, strategy, objectives, policies, and processes are established and agreed to by organizational stakeholders."; status = #notImplemented; evidence = ""; owner = "Procurement"; updatedAt = getCurrentTime() },
      // IDENTIFY Function
      { id = 205; frameworkId = 5; controlId = "ID.AM-01"; controlName = "Asset Inventory – Hardware"; description = "Inventories of hardware managed by the organization are maintained."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 206; frameworkId = 5; controlId = "ID.AM-02"; controlName = "Asset Inventory – Software"; description = "Inventories of software, services, and systems managed by the organization are maintained."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 207; frameworkId = 5; controlId = "ID.AM-03"; controlName = "Network and Data Flows"; description = "Representations of the organization's authorized network communication and internal and external data flows are maintained."; status = #notImplemented; evidence = ""; owner = "Network Admin"; updatedAt = getCurrentTime() },
      { id = 208; frameworkId = 5; controlId = "ID.AM-04"; controlName = "External Systems Inventory"; description = "Inventories of services provided by suppliers are maintained."; status = #notImplemented; evidence = ""; owner = "Procurement"; updatedAt = getCurrentTime() },
      { id = 209; frameworkId = 5; controlId = "ID.AM-05"; controlName = "Asset Prioritization"; description = "Assets are prioritized based on classification, criticality, resources, and impact on the mission."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 210; frameworkId = 5; controlId = "ID.RA-01"; controlName = "Vulnerability Identification"; description = "Vulnerabilities in assets are identified, validated, and recorded."; status = #notImplemented; evidence = ""; owner = "Security Team"; updatedAt = getCurrentTime() },
      { id = 211; frameworkId = 5; controlId = "ID.RA-02"; controlName = "Threat Intelligence"; description = "Cyber threat intelligence is received from information sharing forums and sources."; status = #notImplemented; evidence = ""; owner = "SOC"; updatedAt = getCurrentTime() },
      { id = 212; frameworkId = 5; controlId = "ID.RA-03"; controlName = "Threat Identification"; description = "Internal and external threats to the organization are identified and recorded."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      { id = 213; frameworkId = 5; controlId = "ID.RA-04"; controlName = "Potential Business Impacts"; description = "Potential impacts and likelihoods of threats exploiting vulnerabilities are identified and recorded."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      { id = 214; frameworkId = 5; controlId = "ID.RA-05"; controlName = "Risk Prioritization"; description = "Threats, vulnerabilities, likelihoods, and impacts are used to understand inherent risk and inform risk response prioritization."; status = #notImplemented; evidence = ""; owner = "Risk Manager"; updatedAt = getCurrentTime() },
      // PROTECT Function
      { id = 215; frameworkId = 5; controlId = "PR.AA-01"; controlName = "Identity Management"; description = "Identities and credentials for authorized users, services, and hardware are managed by the organization."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 216; frameworkId = 5; controlId = "PR.AA-02"; controlName = "Identity Proofing"; description = "Identities are proofed and bound to credentials based on the context of interactions."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 217; frameworkId = 5; controlId = "PR.AA-03"; controlName = "User Authentication"; description = "Users, services, and hardware are authenticated."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 218; frameworkId = 5; controlId = "PR.AA-05"; controlName = "Access Permissions"; description = "Access permissions, entitlements, and authorizations are defined in a policy, managed, enforced, and reviewed, and incorporate the principles of least privilege and separation of duties."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 219; frameworkId = 5; controlId = "PR.AT-01"; controlName = "Awareness and Training"; description = "Personnel are provided with awareness and training so that they possess the knowledge and skills to perform general tasks with cybersecurity risks in mind."; status = #notImplemented; evidence = ""; owner = "HR"; updatedAt = getCurrentTime() },
      { id = 220; frameworkId = 5; controlId = "PR.DS-01"; controlName = "Data-at-Rest Protection"; description = "The confidentiality, integrity, and availability of data-at-rest are protected."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 221; frameworkId = 5; controlId = "PR.DS-02"; controlName = "Data-in-Transit Protection"; description = "The confidentiality, integrity, and availability of data-in-transit are protected."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 222; frameworkId = 5; controlId = "PR.PS-01"; controlName = "Configuration Management"; description = "Configuration management practices are established and applied."; status = #notImplemented; evidence = ""; owner = "IT Manager"; updatedAt = getCurrentTime() },
      { id = 223; frameworkId = 5; controlId = "PR.IR-01"; controlName = "Network Integrity Protection"; description = "Networks and environments are protected from unauthorized logical access and usage."; status = #notImplemented; evidence = ""; owner = "Network Admin"; updatedAt = getCurrentTime() },
      // DETECT Function
      { id = 224; frameworkId = 5; controlId = "DE.CM-01"; controlName = "Network Monitoring"; description = "Networks and network services are monitored to find potentially adverse events."; status = #notImplemented; evidence = ""; owner = "SOC"; updatedAt = getCurrentTime() },
      { id = 225; frameworkId = 5; controlId = "DE.CM-02"; controlName = "Physical Environment Monitoring"; description = "The physical environment is monitored to find potentially adverse events."; status = #notImplemented; evidence = ""; owner = "Facilities Manager"; updatedAt = getCurrentTime() },
      { id = 226; frameworkId = 5; controlId = "DE.CM-03"; controlName = "Personnel Activity Monitoring"; description = "Personnel activity and technology usage are monitored to find potentially adverse events."; status = #notImplemented; evidence = ""; owner = "SOC"; updatedAt = getCurrentTime() },
      { id = 227; frameworkId = 5; controlId = "DE.AE-02"; controlName = "Adverse Event Analysis"; description = "Potentially adverse events are analyzed to better characterize the events."; status = #notImplemented; evidence = ""; owner = "SOC"; updatedAt = getCurrentTime() },
      { id = 228; frameworkId = 5; controlId = "DE.AE-06"; controlName = "Incident Reporting"; description = "Information on adverse events is provided to authorized staff and tools."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      // RESPOND Function
      { id = 229; frameworkId = 5; controlId = "RS.MA-01"; controlName = "Incident Management Plan"; description = "The incident response plan is executed in coordination with relevant third parties once an incident is declared."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 230; frameworkId = 5; controlId = "RS.AN-03"; controlName = "Incident Analysis"; description = "Analysis is performed to establish what has taken place during an incident and the root cause of the incident."; status = #notImplemented; evidence = ""; owner = "SOC"; updatedAt = getCurrentTime() },
      { id = 231; frameworkId = 5; controlId = "RS.CO-02"; controlName = "Incident Reporting"; description = "Internal and external stakeholders are notified of incidents."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },
      { id = 232; frameworkId = 5; controlId = "RS.MI-01"; controlName = "Incident Containment"; description = "Incidents are contained."; status = #notImplemented; evidence = ""; owner = "SOC"; updatedAt = getCurrentTime() },
      // RECOVER Function
      { id = 233; frameworkId = 5; controlId = "RC.RP-01"; controlName = "Recovery Plan Execution"; description = "The recovery portion of the incident response plan is executed once initiated from the incident response process."; status = #notImplemented; evidence = ""; owner = "BCM Manager"; updatedAt = getCurrentTime() },
      { id = 234; frameworkId = 5; controlId = "RC.CO-03"; controlName = "Recovery Communication"; description = "Recovery activities and progress in restoring operational capabilities are communicated to designated internal and external stakeholders."; status = #notImplemented; evidence = ""; owner = "CISO"; updatedAt = getCurrentTime() },

      // ── ISO 9001:2015 ── Framework ID 6 ───────────────────────────────────
      { id = 235; frameworkId = 6; controlId = "4.1"; controlName = "Understanding the organization and its context"; description = "The organization shall determine external and internal issues that are relevant to its purpose and strategic direction and that affect its ability to achieve the intended result(s) of its QMS."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 236; frameworkId = 6; controlId = "4.2"; controlName = "Understanding needs and expectations of interested parties"; description = "The organization shall determine the interested parties that are relevant to the QMS and the requirements of these interested parties relevant to the QMS."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 237; frameworkId = 6; controlId = "4.3"; controlName = "Determining the scope of the QMS"; description = "The organization shall determine the boundaries and applicability of the QMS to establish its scope. The scope shall be available and maintained as documented information."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 238; frameworkId = 6; controlId = "4.4"; controlName = "Quality management system and its processes"; description = "The organization shall establish, implement, maintain and continually improve a QMS, including the processes needed and their interactions, in accordance with the requirements of this International Standard."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 239; frameworkId = 6; controlId = "5.1"; controlName = "Leadership and commitment"; description = "Top management shall demonstrate leadership and commitment with respect to the QMS by taking accountability for the effectiveness of the QMS and ensuring the QMS achieves its intended results."; status = #notImplemented; evidence = ""; owner = "Executive Management"; updatedAt = getCurrentTime() },
      { id = 240; frameworkId = 6; controlId = "5.2"; controlName = "Quality Policy"; description = "Top management shall establish, implement and maintain a quality policy that is appropriate to the purpose and context of the organization, provides a framework for setting quality objectives, and includes a commitment to satisfy applicable requirements and to continual improvement."; status = #notImplemented; evidence = ""; owner = "Executive Management"; updatedAt = getCurrentTime() },
      { id = 241; frameworkId = 6; controlId = "5.3"; controlName = "Organizational roles, responsibilities and authorities"; description = "Top management shall ensure that responsibilities and authorities for relevant roles are assigned, communicated and understood within the organization."; status = #notImplemented; evidence = ""; owner = "Executive Management"; updatedAt = getCurrentTime() },
      { id = 242; frameworkId = 6; controlId = "6.1"; controlName = "Actions to address risks and opportunities"; description = "When planning for the QMS, the organization shall consider the issues and requirements referred to in 4.1 and 4.2 and determine the risks and opportunities that need to be addressed."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 243; frameworkId = 6; controlId = "6.2"; controlName = "Quality objectives and planning to achieve them"; description = "The organization shall establish quality objectives at relevant functions, levels and processes needed for the QMS. Quality objectives shall be consistent with the quality policy, measurable, monitored, communicated and updated as appropriate."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 244; frameworkId = 6; controlId = "6.3"; controlName = "Planning of changes"; description = "When the organization determines the need for changes to the QMS, the changes shall be carried out in a planned manner with consideration of the purpose of the changes, the integrity of the QMS, the availability of resources, and the allocation of responsibilities."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 245; frameworkId = 6; controlId = "7.1"; controlName = "Resources"; description = "The organization shall determine and provide the resources needed for the establishment, implementation, maintenance and continual improvement of the QMS, including people, infrastructure, environment, and monitoring resources."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 246; frameworkId = 6; controlId = "7.2"; controlName = "Competence"; description = "The organization shall determine the necessary competence of persons doing work under its control that affects the quality performance and the effectiveness of the QMS."; status = #notImplemented; evidence = ""; owner = "HR"; updatedAt = getCurrentTime() },
      { id = 247; frameworkId = 6; controlId = "7.3"; controlName = "Awareness"; description = "Persons doing work under the organization's control shall be made aware of the quality policy, relevant quality objectives, their contribution to the effectiveness of the QMS, and implications of not conforming with QMS requirements."; status = #notImplemented; evidence = ""; owner = "HR"; updatedAt = getCurrentTime() },
      { id = 248; frameworkId = 6; controlId = "7.4"; controlName = "Communication"; description = "The organization shall determine the internal and external communications relevant to the QMS including on what it will communicate, when to communicate, with whom to communicate, how to communicate, and who communicates."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 249; frameworkId = 6; controlId = "7.5"; controlName = "Documented information"; description = "The organization's QMS shall include documented information required by this International Standard and documented information determined by the organization as being necessary for the effectiveness of the QMS."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 250; frameworkId = 6; controlId = "8.1"; controlName = "Operational planning and control"; description = "The organization shall plan, implement, control, monitor and review the processes needed to meet requirements for the provision of products and services, and to implement the actions determined in 6.1."; status = #notImplemented; evidence = ""; owner = "Operations Manager"; updatedAt = getCurrentTime() },
      { id = 251; frameworkId = 6; controlId = "8.2"; controlName = "Requirements for products and services"; description = "The organization shall establish, implement and maintain a process for communicating with customers in relation to information relating to products and services, enquiries, contracts, orders, and customer feedback including customer complaints."; status = #notImplemented; evidence = ""; owner = "Operations Manager"; updatedAt = getCurrentTime() },
      { id = 252; frameworkId = 6; controlId = "8.3"; controlName = "Design and development of products and services"; description = "The organization shall establish, implement and maintain a design and development process that is appropriate to ensure the subsequent provision of products and services."; status = #notImplemented; evidence = ""; owner = "Dev Manager"; updatedAt = getCurrentTime() },
      { id = 253; frameworkId = 6; controlId = "8.4"; controlName = "Control of externally provided processes, products and services"; description = "The organization shall ensure that externally provided processes, products and services conform to requirements. The organization shall determine the controls to be applied to externally provided processes, products and services."; status = #notImplemented; evidence = ""; owner = "Procurement"; updatedAt = getCurrentTime() },
      { id = 254; frameworkId = 6; controlId = "8.5"; controlName = "Production and service provision"; description = "The organization shall implement production and service provision under controlled conditions, including documented information, suitable monitoring and measuring resources, implementation of monitoring and measurement activities, and the use of suitable infrastructure and process environment."; status = #notImplemented; evidence = ""; owner = "Operations Manager"; updatedAt = getCurrentTime() },
      { id = 255; frameworkId = 6; controlId = "8.6"; controlName = "Release of products and services"; description = "The organization shall implement planned arrangements, at appropriate stages, to verify that the product and service requirements have been met. Release of products and services to the customer shall not proceed until the planned arrangements have been satisfactorily completed."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 256; frameworkId = 6; controlId = "8.7"; controlName = "Control of nonconforming outputs"; description = "The organization shall ensure that outputs that do not conform to their requirements are identified and controlled to prevent their unintended use or delivery."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 257; frameworkId = 6; controlId = "9.1"; controlName = "Monitoring, measurement, analysis and evaluation"; description = "The organization shall determine what needs to be monitored and measured, the methods for monitoring, measurement, analysis and evaluation needed to ensure valid results, when the monitoring and measuring shall be performed, and when the results from monitoring and measurement shall be analysed and evaluated."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 258; frameworkId = 6; controlId = "9.2"; controlName = "Internal audit"; description = "The organization shall conduct internal audits at planned intervals to provide information on whether the QMS conforms to the organization's own requirements for its QMS and the requirements of ISO 9001 and is effectively implemented and maintained."; status = #notImplemented; evidence = ""; owner = "Internal Audit"; updatedAt = getCurrentTime() },
      { id = 259; frameworkId = 6; controlId = "9.3"; controlName = "Management review"; description = "Top management shall review the organization's QMS, at planned intervals, to ensure its continuing suitability, adequacy, effectiveness and alignment with the strategic direction of the organization."; status = #notImplemented; evidence = ""; owner = "Executive Management"; updatedAt = getCurrentTime() },
      { id = 260; frameworkId = 6; controlId = "10.1"; controlName = "Improvement – General"; description = "The organization shall determine and select opportunities for improvement and implement any necessary actions to meet customer requirements and enhance customer satisfaction."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 261; frameworkId = 6; controlId = "10.2"; controlName = "Nonconformity and corrective action"; description = "When a nonconformity occurs, including any arising from complaints, the organization shall react to the nonconformity, take action to control and correct it, deal with the consequences, determine the root cause, and implement any action needed."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
      { id = 262; frameworkId = 6; controlId = "10.3"; controlName = "Continual improvement"; description = "The organization shall continually improve the suitability, adequacy and effectiveness of the QMS. The organization shall consider the results of analysis and evaluation, and the outputs from management review, to determine if there are needs or opportunities that shall be addressed as part of continual improvement."; status = #notImplemented; evidence = ""; owner = "Quality Manager"; updatedAt = getCurrentTime() },
    ];

    for (control in controlSeeds.values()) {
      controls.add(control.id, control);
      nextControlId := control.id + 1;
    };

    // Risk Seeds
    let riskSeeds : [RiskItem] = [
      {
        id = 1;
        tenantId = 0;
        title = "Data Breach via Phishing Attack";
        description = "Risk of unauthorized access to sensitive data through phishing";
        threatCategory = #hostileOutsiders;
        vulnerability = "Lack of security awareness training";
        likelihood = 4;
        impact = 5;
        inherentRiskScore = 20;
        mitigationControls = [];
        residualRiskScore = 20;
        riskLevel = #critical;
        treatment = #mitigate;
        treatmentOwner = "Security Team";
        treatmentNotes = "Implement security awareness training and email filtering";
        treatmentPlanDescription = "Security Awareness Training Program";
        treatmentPlanOwner = "Cybersecurity Team";
        treatmentPlanTargetDate = "2024-08-15";
        treatmentPlanReviewDate = "2024-12-15";
        dueDate = "2024-06-30";
        status = #inTreatment;
        createdAt = getCurrentTime();
        updatedAt = getCurrentTime();
      },
      {
        id = 2;
        tenantId = 0;
        title = "Third-Party Vendor Risk";
        description = "Risk from inadequate security controls at third-party vendors";
        threatCategory = #dependencyProblems;
        vulnerability = "Limited vendor security assessments";
        likelihood = 3;
        impact = 4;
        inherentRiskScore = 12;
        mitigationControls = [];
        residualRiskScore = 12;
        riskLevel = #medium;
        treatment = #mitigate;
        treatmentOwner = "Procurement";
        treatmentNotes = "Establish vendor risk assessment program";
        treatmentPlanDescription = "Vendor Security Assessment Guidelines";
        treatmentPlanOwner = "Vendor Management Office";
        treatmentPlanTargetDate = "2024-09-30";
        treatmentPlanReviewDate = "2025-09-30";
        dueDate = "2024-09-30";
        status = #open;
        createdAt = getCurrentTime();
        updatedAt = getCurrentTime();
      },
      {
        id = 3;
        tenantId = 0;
        title = "GDPR Non-Compliance";
        description = "Risk of regulatory penalties due to GDPR violations";
        threatCategory = #legal;
        vulnerability = "Incomplete data mapping";
        likelihood = 2;
        impact = 5;
        inherentRiskScore = 10;
        mitigationControls = [];
        residualRiskScore = 10;
        riskLevel = #medium;
        treatment = #mitigate;
        treatmentOwner = "Legal Team";
        treatmentNotes = "Complete data protection impact assessments";
        treatmentPlanDescription = "GDPR Compliance Checklist";
        treatmentPlanOwner = "Data Protection Officer";
        treatmentPlanTargetDate = "2024-08-15";
        treatmentPlanReviewDate = "2024-12-01";
        dueDate = "2024-12-01";
        status = #inTreatment;
        createdAt = getCurrentTime();
        updatedAt = getCurrentTime();
      },
      {
        id = 4;
        tenantId = 0;
        title = "System Downtime";
        description = "Risk of extended system unavailability";
        threatCategory = #technicalProblems;
        vulnerability = "Single point of failure in critical systems";
        likelihood = 2;
        impact = 3;
        inherentRiskScore = 6;
        mitigationControls = [];
        residualRiskScore = 6;
        riskLevel = #low;
        treatment = #accept;
        treatmentOwner = "IT Operations";
        treatmentNotes = "Acceptable risk with current backup procedures";
        treatmentPlanDescription = "Business Continuity Plan (BCP)";
        treatmentPlanOwner = "BCP Manager";
        treatmentPlanTargetDate = "2024-12-31";
        treatmentPlanReviewDate = "2025-05-15";
        dueDate = "2024-12-31";
        status = #open;
        createdAt = getCurrentTime();
        updatedAt = getCurrentTime();
      },
      {
        id = 5;
        tenantId = 0;
        title = "Insider Threat";
        description = "Risk of malicious or negligent insider actions";
        threatCategory = #hostileInsiders;
        vulnerability = "Insufficient monitoring of privileged accounts";
        likelihood = 2;
        impact = 4;
        inherentRiskScore = 8;
        mitigationControls = [];
        residualRiskScore = 8;
        riskLevel = #medium;
        treatment = #mitigate;
        treatmentOwner = "Security Team";
        treatmentNotes = "Implement privileged access management solution";
        treatmentPlanDescription = "Privileged Access Management Implementation";
        treatmentPlanOwner = "Identity Management Team";
        treatmentPlanTargetDate = "2024-07-31";
        treatmentPlanReviewDate = "2024-08-01";
        dueDate = "2024-07-31";
        status = #open;
        createdAt = getCurrentTime();
        updatedAt = getCurrentTime();
      },
    ];

    for (risk in riskSeeds.values()) {
      risks.add(risk.id, risk);
      nextRiskId := risk.id + 1;
    };

    // Governance Seeds
    let governanceSeeds : [GovernanceItem] = [
      {
        id = 1;
        title = "Information Security Policy";
        category = #policy;
        description = "Enterprise-wide information security policy";
        owner = "CISO";
        status = #active;
        reviewDate = "2024-12-31";
        approvedBy = "Board of Directors";
        createdAt = getCurrentTime();
        updatedAt = getCurrentTime();
      },
      {
        id = 2;
        title = "Security Steering Committee";
        category = #committee;
        description = "Monthly security governance committee";
        owner = "CISO";
        status = #active;
        reviewDate = "2024-06-30";
        approvedBy = "CEO";
        createdAt = getCurrentTime();
        updatedAt = getCurrentTime();
      },
      {
        id = 3;
        title = "Q2 2024 Risk Review Meeting";
        category = #meeting;
        description = "Quarterly enterprise risk review";
        owner = "Risk Manager";
        status = #active;
        reviewDate = "2024-06-15";
        approvedBy = "CFO";
        createdAt = getCurrentTime();
        updatedAt = getCurrentTime();
      },
      {
        id = 4;
        title = "Complete SOC 2 Audit Preparation";
        category = #actionItem;
        description = "Prepare documentation for SOC 2 Type II audit";
        owner = "Compliance Manager";
        status = #active;
        reviewDate = "2024-05-31";
        approvedBy = "CISO";
        createdAt = getCurrentTime();
        updatedAt = getCurrentTime();
      },
      {
        id = 5;
        title = "Data Retention Policy";
        category = #policy;
        description = "Policy governing data retention and disposal";
        owner = "Legal Team";
        status = #underReview;
        reviewDate = "2024-07-31";
        approvedBy = "General Counsel";
        createdAt = getCurrentTime();
        updatedAt = getCurrentTime();
      },
    ];

    for (item in governanceSeeds.values()) {
      governanceItems.add(item.id, item);
      nextGovernanceId := item.id + 1;
    };
  };

  // Risk Management Updates
  public shared ({ caller }) func createRisk(input : CreateRiskInput) : async Nat {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can create risks");
    };

    let callerTenantId = getCallerTenantId(caller);

    let id = nextRiskId;
    let inherentRiskScore = input.likelihood * input.impact;
    let residualRiskScore = calculateResidualRiskScore(inherentRiskScore, input.mitigationControls);
    let riskLevel = determineRiskLevel(residualRiskScore);

    let risk : RiskItem = {
      id;
      tenantId = callerTenantId;
      title = input.title;
      description = input.description;
      threatCategory = input.threatCategory;
      vulnerability = input.vulnerability;
      likelihood = input.likelihood;
      impact = input.impact;
      inherentRiskScore;
      mitigationControls = input.mitigationControls;
      residualRiskScore;
      riskLevel;
      treatment = input.treatment;
      treatmentOwner = input.treatmentOwner;
      treatmentNotes = input.treatmentNotes;
      treatmentPlanDescription = input.treatmentPlanDescription;
      treatmentPlanOwner = input.treatmentPlanOwner;
      treatmentPlanTargetDate = input.treatmentPlanTargetDate;
      treatmentPlanReviewDate = input.treatmentPlanReviewDate;
      dueDate = input.dueDate;
      status = switch (input.status) { case (null) { #open }; case (?val) { val } };
      createdAt = getCurrentTime();
      updatedAt = getCurrentTime();
    };

    risks.add(id, risk);
    nextRiskId += 1;
    id;
  };

  public shared ({ caller }) func updateRisk(input : UpdateRiskInput) : async RiskItem {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can update risks");
    };

    switch (risks.get(input.id)) {
      case (null) { Runtime.trap("Risk not found") };
      case (?existing) {
        let likelihood = switch (input.likelihood) {
          case (null) { existing.likelihood };
          case (?val) { val };
        };
        let impact = switch (input.impact) {
          case (null) { existing.impact };
          case (?val) { val };
        };
        let inherentRiskScore = likelihood * impact;

        let mitigationControls = switch (input.mitigationControls) {
          case (null) { existing.mitigationControls };
          case (?val) { val };
        };

        let residualRiskScore = calculateResidualRiskScore(
          inherentRiskScore,
          mitigationControls,
        );
        let riskLevel = determineRiskLevel(residualRiskScore);

        let updated : RiskItem = {
          existing with
          title = switch (input.title) { case (null) { existing.title }; case (?val) { val } };
          description = switch (input.description) {
            case (null) { existing.description };
            case (?val) { val };
          };
          threatCategory = switch (input.threatCategory) {
            case (null) { existing.threatCategory };
            case (?val) { val };
          };
          vulnerability = switch (input.vulnerability) { case (null) { existing.vulnerability }; case (?val) { val } };
          likelihood;
          impact;
          inherentRiskScore;
          mitigationControls;
          residualRiskScore;
          riskLevel;
          treatment = switch (input.treatment) { case (null) { existing.treatment }; case (?val) { val } };
          treatmentOwner = switch (input.treatmentOwner) {
            case (null) { existing.treatmentOwner };
            case (?val) { val };
          };
          treatmentNotes = switch (input.treatmentNotes) {
            case (null) { existing.treatmentNotes };
            case (?val) { val };
          };
          treatmentPlanDescription = switch (input.treatmentPlanDescription) {
            case (null) { existing.treatmentPlanDescription };
            case (?val) { val };
          };
          treatmentPlanOwner = switch (input.treatmentPlanOwner) {
            case (null) { existing.treatmentPlanOwner };
            case (?val) { val };
          };
          treatmentPlanTargetDate = switch (input.treatmentPlanTargetDate) {
            case (null) { existing.treatmentPlanTargetDate };
            case (?val) { val };
          };
          treatmentPlanReviewDate = switch (input.treatmentPlanReviewDate) {
            case (null) { existing.treatmentPlanReviewDate };
            case (?val) { val };
          };
          dueDate = switch (input.dueDate) { case (null) { existing.dueDate }; case (?val) { val } };
          status = switch (input.status) { case (null) { existing.status }; case (?val) { val } };
          createdAt = existing.createdAt;
          updatedAt = getCurrentTime();
        };

        risks.add(input.id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func deleteRisk(id : Nat) : async () {
    let callerTenantId = getCallerTenantId(caller);
    switch (risks.get(id)) {
      case (null) { Runtime.trap("Risk not found") };
      case (?risk) {
        if (risk.tenantId != callerTenantId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Cannot delete another tenant's risk");
        };
        risks.remove(id);
      };
    };
  };

  public query ({ caller }) func getRisks() : async [RiskItem] {
    let callerTenantId = getCallerTenantId(caller);
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return risks.values().toArray();
    };
    risks.values().toArray().filter(func(risk) { risk.tenantId == callerTenantId });
  };

  public query ({ caller }) func getRiskById(id : Nat) : async ?RiskItem {
    let callerTenantId = getCallerTenantId(caller);
    switch (risks.get(id)) {
      case (null) { null };
      case (?risk) {
        if (risk.tenantId == callerTenantId or AccessControl.isAdmin(accessControlState, caller)) {
          ?risk;
        } else { null };
      };
    };
  };

  public query ({ caller }) func getRisksByTenant(tenantId : Nat) : async [RiskItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view risks by tenant");
    };
    risks.values().toArray().filter(func(risk) { risk.tenantId == tenantId });
  };

  public query ({ caller }) func getRiskStats() : async RiskStats {
    let callerTenantId = getCallerTenantId(caller);
    let all = risks.values().toArray();
    let filtered = if (AccessControl.isAdmin(accessControlState, caller)) {
      all;
    } else {
      all.filter(func(risk) { risk.tenantId == callerTenantId });
    };
    let total = filtered.size();

    let low = filtered.filter(func(r) { r.riskLevel == #low }).size();
    let medium = filtered.filter(func(r) { r.riskLevel == #medium }).size();
    let high = filtered.filter(func(r) { r.riskLevel == #high }).size();
    let critical = filtered.filter(func(r) { r.riskLevel == #critical }).size();

    let open = filtered.filter(func(r) { r.status == #open }).size();
    let inTreatment = filtered.filter(func(r) { r.status == #inTreatment }).size();
    let closed = filtered.filter(func(r) { r.status == #closed }).size();

    let avgInherentScore = if (total == 0) { 0 } else {
      let sum = filtered.foldLeft(
        0,
        func(acc, risk) { acc + risk.inherentRiskScore },
      );
      sum / total;
    };

    let avgResidualScore = if (total == 0) { 0 } else {
      let sum = filtered.foldLeft(
        0,
        func(acc, risk) { acc + risk.residualRiskScore },
      );
      sum / total;
    };

    {
      total;
      avgInherentScore;
      avgResidualScore;
      byLevel = [(#low, low), (#medium, medium), (#high, high), (#critical, critical)];
      byStatus = [(#open, open), (#inTreatment, inTreatment), (#closed, closed)];
    };
  };

  // Governance Operations
  public shared ({ caller }) func createGovernanceItem(input : CreateGovernanceItemInput) : async Nat {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can create governance items");
    };

    let callerTenantId = getCallerTenantId(caller);
    let id = nextGovernanceId;

    let item : GovernanceItem = {
      id;
      title = input.title;
      category = input.category;
      description = input.description;
      owner = input.owner;
      status = #draft;
      reviewDate = input.reviewDate;
      approvedBy = input.approvedBy;
      createdAt = getCurrentTime();
      updatedAt = getCurrentTime();
    };

    governanceItems.add(id, item);
    govTenantMap.add(id, callerTenantId);
    nextGovernanceId += 1;
    id;
  };

  public shared ({ caller }) func updateGovernanceItem(input : UpdateGovernanceItemInput) : async GovernanceItem {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can update governance items");
    };

    switch (governanceItems.get(input.id)) {
      case (null) { Runtime.trap("Governance item not found") };
      case (?existing) {
        let updated : GovernanceItem = {
          id = existing.id;
          title = switch (input.title) { case (null) { existing.title }; case (?val) { val } };
          category = switch (input.category) { case (null) { existing.category }; case (?val) { val } };
          description = switch (input.description) {
            case (null) { existing.description };
            case (?val) { val };
          };
          owner = switch (input.owner) { case (null) { existing.owner }; case (?val) { val } };
          status = switch (input.status) { case (null) { existing.status }; case (?val) { val } };
          reviewDate = switch (input.reviewDate) {
            case (null) { existing.reviewDate };
            case (?val) { val };
          };
          approvedBy = switch (input.approvedBy) {
            case (null) { existing.approvedBy };
            case (?val) { val };
          };
          createdAt = existing.createdAt;
          updatedAt = getCurrentTime();
        };

        governanceItems.add(input.id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func deleteGovernanceItem(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete governance items");
    };

    switch (governanceItems.get(id)) {
      case (null) { Runtime.trap("Governance item not found") };
      case (?_) {
        governanceItems.remove(id);
      };
    };
  };

  public query ({ caller }) func getGovernanceItems() : async [GovernanceItem] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can view governance items");
    };
    let callerTenantId = getCallerTenantId(caller);
    if (AccessControl.isAdmin(accessControlState, caller)) {
      governanceItems.values().toArray();
    } else {
      governanceItems.values().toArray().filter(func(item) {
        switch (govTenantMap.get(item.id)) {
          case (null) { true }; // seed data (tenantId 0) visible to all
          case (?tid) { tid == callerTenantId or tid == 0 };
        };
      });
    };
  };

  public query ({ caller }) func getGovernanceSummary() : async GovernanceSummary {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can view governance summary");
    };

    let callerTenantId = getCallerTenantId(caller);
    let all = if (AccessControl.isAdmin(accessControlState, caller)) {
      governanceItems.values().toArray();
    } else {
      governanceItems.values().toArray().filter(func(item) {
        switch (govTenantMap.get(item.id)) {
          case (null) { true };
          case (?tid) { tid == callerTenantId or tid == 0 };
        };
      });
    };
    let total = all.size();

    let policies = all.filter(func(i) { i.category == #policy }).size();
    let committees = all.filter(func(i) { i.category == #committee }).size();
    let meetings = all.filter(func(i) { i.category == #meeting }).size();
    let actions = all.filter(func(i) { i.category == #actionItem }).size();

    let draft = all.filter(func(i) { i.status == #draft }).size();
    let active = all.filter(func(i) { i.status == #active }).size();
    let review = all.filter(func(i) { i.status == #underReview }).size();
    let retired = all.filter(func(i) { i.status == #retired }).size();

    {
      total;
      byCategory = [(#policy, policies), (#committee, committees), (#meeting, meetings), (#actionItem, actions)];
      byStatus = [(
        #draft,
        draft
      ), (#active, active), (#underReview, review), (#retired, retired)];
    };
  };

  // Compliance Management
  public shared ({ caller }) func createComplianceControl(input : CreateComplianceControlInput) : async Nat {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can create compliance controls");
    };

    let id = nextControlId;

    let callerTenantId2 = getCallerTenantId(caller);
    let control : ComplianceControl = {
      id;
      frameworkId = input.frameworkId;
      controlId = input.controlId;
      controlName = input.controlName;
      description = input.description;
      status = input.status;
      evidence = input.evidence;
      owner = input.owner;
      updatedAt = getCurrentTime();
    };

    controls.add(id, control);
    ctrlTenantMap.add(id, callerTenantId2);
    nextControlId += 1;
    id;
  };

  public shared ({ caller }) func updateComplianceControl(input : UpdateComplianceControlInput) : async ComplianceControl {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can update compliance controls");
    };

    switch (controls.get(input.id)) {
      case (null) { Runtime.trap("Control not found") };
      case (?existing) {
        let updated : ComplianceControl = {
          id = existing.id;
          frameworkId = existing.frameworkId;
          controlId = existing.controlId;
          controlName = existing.controlName;
          description = existing.description;
          status = switch (input.status) { case (null) { existing.status }; case (?val) { val } };
          evidence = switch (input.evidence) {
            case (null) { existing.evidence };
            case (?val) { val };
          };
          owner = switch (input.owner) { case (null) { existing.owner }; case (?val) { val } };
          updatedAt = getCurrentTime();
        };

        controls.add(input.id, updated);
        updated;
      };
    };
  };

  public query ({ caller }) func getComplianceFrameworks() : async [ComplianceFramework] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can view compliance frameworks");
    };
    frameworks.values().toArray();
  };

  public query ({ caller }) func getComplianceControls(frameworkId : Nat) : async [ComplianceControl] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can view compliance controls");
    };
    let callerTenantId = getCallerTenantId(caller);
    let tenantControls = if (AccessControl.isAdmin(accessControlState, caller)) {
      controls.values().toArray();
    } else {
      controls.values().toArray().filter(func(c) {
        switch (ctrlTenantMap.get(c.id)) {
          case (null) { true }; // seed data visible to all
          case (?tid) { tid == callerTenantId or tid == 0 };
        };
      });
    };
    tenantControls.filter(func(c) { c.frameworkId == frameworkId });
  };

  public query ({ caller }) func getComplianceScores() : async [ComplianceScores] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only approved users can view compliance scores");
    };

    let results = List.empty<ComplianceScores>();

    let callerTenantId = getCallerTenantId(caller);
    let allControls = if (AccessControl.isAdmin(accessControlState, caller)) {
      controls.values().toArray();
    } else {
      controls.values().toArray().filter(func(c) {
        switch (ctrlTenantMap.get(c.id)) {
          case (null) { true };
          case (?tid) { tid == callerTenantId or tid == 0 };
        };
      });
    };
    for (framework in frameworks.values()) {
      let frameworkControls = allControls.filter(
        func(c) { c.frameworkId == framework.id }
      );
      let total = frameworkControls.size();
      let implemented = frameworkControls.filter(
        func(c) { c.status == #fullyImplemented }
      ).size();

      let score = if (total == 0) { 0 } else { (implemented * 100) / total };

      results.add({
        frameworkName = framework.name;
        score;
        total;
        implemented;
      });
    };

    results.toArray();
  };

  // SSO Configuration
  public type SSOConfig = {
    enabled : Bool;
    requireDomainWhitelist : Bool;
    allowedDomains : [Text];
    idpName : Text;
    idpIssuerUrl : Text;
    idpClientId : Text;
    notes : Text;
  };

  var ssoConfig : SSOConfig = {
    enabled = false;
    requireDomainWhitelist = false;
    allowedDomains = [];
    idpName = "";
    idpIssuerUrl = "";
    idpClientId = "";
    notes = "";
  };

  public query ({ caller }) func getSSOConfig() : async SSOConfig {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view SSO configuration");
    };
    ssoConfig;
  };

  public shared ({ caller }) func setSSOConfig(config : SSOConfig) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update SSO configuration");
    };
    ssoConfig := config;
  };

  // Tenant User Registration and Login System
  public type TenantOrg = {
    id : Text;
    companyName : Text;
    domain : Text;
    createdAt : Int;
  };

  public type UserRegistrationInput = {
    fullName : Text;
    email : Text;
    password : Text;
    companyName : Text;
    domain : Text;
  };

  public type TenantUser = {
    id : Text;
    fullName : Text;
    email : Text;
    passwordHash : Text;
    companyName : Text;
    domain : Text;
    role : Text;
    approved : Bool;
    createdAt : Int;
  };

  public type TenantUserLoginResponse = {
    id : Text;
    fullName : Text;
    email : Text;
    companyName : Text;
    domain : Text;
    role : Text;
  };

  public type RegistrationResult = {
    #ok : ();
    #domainAlreadyRegistered : ();
    #userAlreadyExists : ();
    #invalidInput : ();
  };

  public type TenantLoginResult = {
    #ok : TenantUserLoginResponse;
    #invalidEmail : ();
    #invalidPassword : ();
    #userNotFound : ();
    #notApproved : ();
    #internalError : ();
  };

  let tenantOrgs = Map.empty<Text, TenantOrg>();
  let tenantUsers = Map.empty<Text, TenantUser>();
  let tenantUsersByEmail = Map.empty<Text, TenantUser>();

  var nextTenantOrgId = 1;
  var nextTenantUserId = 1;

  // Public registration endpoint - no authorization required
  public shared ({ caller }) func registerTenantUser(input : UserRegistrationInput) : async RegistrationResult {
    // Check if user already exists
    switch (tenantUsersByEmail.get(input.email)) {
      case (?_) {
        return #userAlreadyExists;
      };
      case (null) {};
    };

    // Create or reuse TenantOrg
    let tenantOrgId = switch (tenantOrgs.get(input.domain)) {
      case (?existingOrg) {
        existingOrg.id;
      };
      case (null) {
        let newOrgId = nextTenantOrgId.toText();
        let tenantOrg : TenantOrg = {
          id = newOrgId;
          companyName = input.companyName;
          domain = input.domain;
          createdAt = Time.now();
        };
        tenantOrgs.add(input.domain, tenantOrg);
        nextTenantOrgId += 1;
        newOrgId;
      };
    };

    // Create tenant user
    let userId = nextTenantUserId.toText();
    let tenantUser : TenantUser = {
      id = userId;
      fullName = input.fullName;
      email = input.email;
      passwordHash = input.password;
      companyName = input.companyName;
      domain = input.domain;
      role = "user";
      approved = false;
      createdAt = Time.now();
    };

    tenantUsers.add(userId, tenantUser);
    tenantUsersByEmail.add(input.email, tenantUser);
    nextTenantUserId += 1;

    #ok;
  };

  // Public login endpoint - no authorization required
  public shared ({ caller }) func tenantLogin(email : Text, password : Text) : async TenantLoginResult {
    switch (tenantUsersByEmail.get(email)) {
      case (null) {
        #userNotFound;
      };
      case (?user) {
        if (user.passwordHash != password) {
          #invalidPassword;
        } else if (not user.approved) {
          #notApproved;
        } else {
          #ok({
            id = user.id;
            fullName = user.fullName;
            email = user.email;
            companyName = user.companyName;
            domain = user.domain;
            role = user.role;
          });
        };
      };
    };
  };

  // Public query - allows domain lookup during registration
  public query ({ caller }) func getTenantOrg(domain : Text) : async ?TenantOrg {
    tenantOrgs.get(domain);
  };

  // Admin-only function
  public query ({ caller }) func listTenantUsers() : async [TenantUser] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view tenant users");
    };
    tenantUsers.values().toArray();
  };


  // Get all tenant users for a specific domain (accessible to approved users of that domain)
  public query ({ caller }) func getTenantUsersForDomain(domain : Text) : async [TenantUser] {
    tenantUsers.values().toArray().filter(func(u) { u.domain == domain and u.approved });
  };

  // Update a tenant user's role (admin only)
  public shared ({ caller }) func updateTenantUserRole(userId : Text, role : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update user roles");
    };
    switch (tenantUsers.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let updatedUser = { user with role = role };
        tenantUsers.add(userId, updatedUser);
      };
    };
  };

  // Admin-only function
  public shared ({ caller }) func approveTenantUser(userId : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can approve tenant users");
    };
    
    switch (tenantUsers.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        let updatedUser = { user with approved = true };
        tenantUsers.add(userId, updatedUser);
        tenantUsersByEmail.add(user.email, updatedUser);
      };
    };
  };

  // ── Uploaded Document Metadata (blob-storage backed) ─────────────────────

  public type UploadedDocumentMeta = {
    id : Nat;
    title : Text;
    clauseNumber : Text;
    fileName : Text;
    fileSize : Nat;
    blobUrl : Text;
    uploadedAt : Int;
  };

  var uploadedDocCounter : Nat = 0;
  let uploadedDocuments = Map.empty<Nat, UploadedDocumentMeta>();

  public shared ({ caller }) func addUploadedDocument(title : Text, clauseNumber : Text, fileName : Text, fileSize : Nat, blobUrl : Text) : async Nat {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    uploadedDocCounter += 1;
    let meta : UploadedDocumentMeta = {
      id = uploadedDocCounter;
      title;
      clauseNumber;
      fileName;
      fileSize;
      blobUrl;
      uploadedAt = Time.now();
    };
    uploadedDocuments.add(uploadedDocCounter, meta);
    uploadedDocCounter;
  };

  public query ({ caller }) func getUploadedDocuments() : async [UploadedDocumentMeta] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    uploadedDocuments.values().toArray();
  };

  public shared ({ caller }) func deleteUploadedDocument(id : Nat) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    uploadedDocuments.remove(id);
  };

  // ── Governance Attachment Metadata (blob-storage backed) ─────────────────

  public type GovAttachmentMeta = {
    fileName : Text;
    fileSize : Nat;
    blobUrl : Text;
    uploadedAt : Int;
  };

  let govAttachments = Map.empty<Nat, GovAttachmentMeta>();

  public shared ({ caller }) func setGovernanceAttachment(governanceItemId : Nat, fileName : Text, fileSize : Nat, blobUrl : Text) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    govAttachments.add(governanceItemId, {
      fileName;
      fileSize;
      blobUrl;
      uploadedAt = Time.now();
    });
  };

  public query ({ caller }) func getGovernanceAttachment(governanceItemId : Nat) : async ?GovAttachmentMeta {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    govAttachments.get(governanceItemId);
  };

  public query ({ caller }) func getGovernanceAttachments() : async [(Nat, GovAttachmentMeta)] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    govAttachments.entries().toArray();
  };

  public shared ({ caller }) func deleteGovernanceAttachment(governanceItemId : Nat) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    govAttachments.remove(governanceItemId);
  };

  // ── Governance Framework Mappings ─────────────────────────────────────────

  public type GovFrameworkMapping = {
    frameworkId : Nat;
    frameworkName : Text;
  };

  let govFrameworkMappings = Map.empty<Nat, GovFrameworkMapping>();

  public shared ({ caller }) func setGovernanceFrameworkMapping(governanceItemId : Nat, frameworkId : Nat, frameworkName : Text) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    govFrameworkMappings.add(governanceItemId, { frameworkId; frameworkName });
  };

  public query ({ caller }) func getGovernanceFrameworkMappings() : async [(Nat, GovFrameworkMapping)] {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    govFrameworkMappings.entries().toArray();
  };

  public shared ({ caller }) func deleteGovernanceFrameworkMapping(governanceItemId : Nat) : async () {
    if (not isApprovedOrAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    govFrameworkMappings.remove(governanceItemId);
  };
  // ── Tenant Org Nat ID mapping (for email/password tenant users) ───────────
  // Maps domain -> Nat tenant ID so tenant-user risks/gov/compliance use same tenantId field
  let tenantOrgNatIdMap = Map.empty<Text, Nat>();
  var nextTenantOrgNatId = 1000; // Start at 1000 to avoid collision with admin-created tenants

  func getTenantNatIdForDomain(domain : Text) : Nat {
    switch (tenantOrgNatIdMap.get(domain)) {
      case (?id) { id };
      case (null) { 0 };
    };
  };

  func getOrCreateTenantNatIdForDomain(domain : Text) : Nat {
    switch (tenantOrgNatIdMap.get(domain)) {
      case (?id) { id };
      case (null) {
        let id = nextTenantOrgNatId;
        tenantOrgNatIdMap.add(domain, id);
        nextTenantOrgNatId += 1;
        id;
      };
    };
  };

  // ── Tenant-User APIs (authenticated by userId, no II required) ────────────

  public query ({ caller }) func getRisksAsTenantUser(userId : Text) : async [RiskItem] {
    switch (tenantUsers.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (not user.approved) { Runtime.trap("User not approved") };
        let natId = getTenantNatIdForDomain(user.domain);
        if (natId == 0) { return [] };
        risks.values().toArray().filter(func(r) { r.tenantId == natId });
      };
    };
  };

  public shared ({ caller }) func createRiskAsTenantUser(userId : Text, input : CreateRiskInput) : async Nat {
    switch (tenantUsers.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (not user.approved) { Runtime.trap("User not approved") };
        let natId = getOrCreateTenantNatIdForDomain(user.domain);
        let id = nextRiskId;
        let inherentRiskScore = input.likelihood * input.impact;
        let residualRiskScore = calculateResidualRiskScore(inherentRiskScore, input.mitigationControls);
        let riskLevel = determineRiskLevel(residualRiskScore);
        let risk : RiskItem = {
          id;
          tenantId = natId;
          title = input.title;
          description = input.description;
          threatCategory = input.threatCategory;
          vulnerability = input.vulnerability;
          likelihood = input.likelihood;
          impact = input.impact;
          inherentRiskScore;
          mitigationControls = input.mitigationControls;
          residualRiskScore;
          riskLevel;
          treatment = input.treatment;
          treatmentOwner = input.treatmentOwner;
          treatmentNotes = input.treatmentNotes;
          treatmentPlanDescription = input.treatmentPlanDescription;
          treatmentPlanOwner = input.treatmentPlanOwner;
          treatmentPlanTargetDate = input.treatmentPlanTargetDate;
          treatmentPlanReviewDate = input.treatmentPlanReviewDate;
          dueDate = input.dueDate;
          status = switch (input.status) { case (null) { #open }; case (?s) { s } };
          createdAt = getCurrentTime();
          updatedAt = getCurrentTime();
        };
        risks.add(id, risk);
        nextRiskId += 1;
        id;
      };
    };
  };

  public shared ({ caller }) func deleteRiskAsTenantUser(userId : Text, riskId : Nat) : async () {
    switch (tenantUsers.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (not user.approved) { Runtime.trap("User not approved") };
        let natId = getTenantNatIdForDomain(user.domain);
        switch (risks.get(riskId)) {
          case (null) { Runtime.trap("Risk not found") };
          case (?risk) {
            if (risk.tenantId != natId) { Runtime.trap("Unauthorized: Not your tenant's risk") };
            risks.remove(riskId);
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateRiskAsTenantUser(userId : Text, input : UpdateRiskInput) : async RiskItem {
    switch (tenantUsers.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (not user.approved) { Runtime.trap("User not approved") };
        let natId = getTenantNatIdForDomain(user.domain);
        switch (risks.get(input.id)) {
          case (null) { Runtime.trap("Risk not found") };
          case (?existing) {
            if (existing.tenantId != natId) { Runtime.trap("Unauthorized: Not your tenant\'s risk") };
            let likelihood = switch (input.likelihood) { case (null) { existing.likelihood }; case (?val) { val } };
            let impact = switch (input.impact) { case (null) { existing.impact }; case (?val) { val } };
            let inherentRiskScore = likelihood * impact;
            let mitigationControls = switch (input.mitigationControls) { case (null) { existing.mitigationControls }; case (?val) { val } };
            let residualRiskScore = calculateResidualRiskScore(inherentRiskScore, mitigationControls);
            let riskLevel = determineRiskLevel(residualRiskScore);
            let updated : RiskItem = {
              existing with
              title = switch (input.title) { case (null) { existing.title }; case (?val) { val } };
              description = switch (input.description) { case (null) { existing.description }; case (?val) { val } };
              threatCategory = switch (input.threatCategory) { case (null) { existing.threatCategory }; case (?val) { val } };
              vulnerability = switch (input.vulnerability) { case (null) { existing.vulnerability }; case (?val) { val } };
              likelihood;
              impact;
              inherentRiskScore;
              mitigationControls;
              residualRiskScore;
              riskLevel;
              treatment = switch (input.treatment) { case (null) { existing.treatment }; case (?val) { val } };
              treatmentOwner = switch (input.treatmentOwner) { case (null) { existing.treatmentOwner }; case (?val) { val } };
              treatmentNotes = switch (input.treatmentNotes) { case (null) { existing.treatmentNotes }; case (?val) { val } };
              treatmentPlanDescription = switch (input.treatmentPlanDescription) { case (null) { existing.treatmentPlanDescription }; case (?val) { val } };
              treatmentPlanOwner = switch (input.treatmentPlanOwner) { case (null) { existing.treatmentPlanOwner }; case (?val) { val } };
              treatmentPlanTargetDate = switch (input.treatmentPlanTargetDate) { case (null) { existing.treatmentPlanTargetDate }; case (?val) { val } };
              treatmentPlanReviewDate = switch (input.treatmentPlanReviewDate) { case (null) { existing.treatmentPlanReviewDate }; case (?val) { val } };
              dueDate = switch (input.dueDate) { case (null) { existing.dueDate }; case (?val) { val } };
              status = switch (input.status) { case (null) { existing.status }; case (?val) { val } };
              updatedAt = getCurrentTime();
            };
            risks.add(input.id, updated);
            updated;
          };
        };
      };
    };
  };


  public query ({ caller }) func getGovernanceItemsAsTenantUser(userId : Text) : async [GovernanceItem] {
    switch (tenantUsers.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (not user.approved) { Runtime.trap("User not approved") };
        let natId = getTenantNatIdForDomain(user.domain);
        if (natId == 0) { return [] };
        governanceItems.values().toArray().filter(func(item) {
          switch (govTenantMap.get(item.id)) {
            case (?tid) { tid == natId };
            case (null) { false }; // seed data not shown to tenant users
          };
        });
      };
    };
  };

  public shared ({ caller }) func createGovernanceItemAsTenantUser(userId : Text, input : CreateGovernanceItemInput) : async Nat {
    switch (tenantUsers.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (not user.approved) { Runtime.trap("User not approved") };
        let natId = getOrCreateTenantNatIdForDomain(user.domain);
        let id = nextGovernanceId;
        let item : GovernanceItem = {
          id;
          title = input.title;
          category = input.category;
          description = input.description;
          owner = input.owner;
          status = #draft;
          reviewDate = input.reviewDate;
          approvedBy = input.approvedBy;
          createdAt = getCurrentTime();
          updatedAt = getCurrentTime();
        };
        governanceItems.add(id, item);
        govTenantMap.add(id, natId);
        nextGovernanceId += 1;
        id;
      };
    };
  };


  public shared ({ caller }) func updateGovernanceItemAsTenantUser(userId : Text, input : UpdateGovernanceItemInput) : async GovernanceItem {
    switch (tenantUsers.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (not user.approved) { Runtime.trap("User not approved") };
        switch (governanceItems.get(input.id)) {
          case (null) { Runtime.trap("Governance item not found") };
          case (?existing) {
            let updated : GovernanceItem = {
              id = existing.id;
              title = switch (input.title) { case (null) { existing.title }; case (?val) { val } };
              category = switch (input.category) { case (null) { existing.category }; case (?val) { val } };
              description = switch (input.description) { case (null) { existing.description }; case (?val) { val } };
              owner = switch (input.owner) { case (null) { existing.owner }; case (?val) { val } };
              status = switch (input.status) { case (null) { existing.status }; case (?val) { val } };
              reviewDate = switch (input.reviewDate) { case (null) { existing.reviewDate }; case (?val) { val } };
              approvedBy = switch (input.approvedBy) { case (null) { existing.approvedBy }; case (?val) { val } };
              createdAt = existing.createdAt;
              updatedAt = getCurrentTime();
            };
            governanceItems.add(input.id, updated);
            updated;
          };
        };
      };
    };
  };
  public query ({ caller }) func getComplianceControlsAsTenantUser(userId : Text, frameworkId : Nat) : async [ComplianceControl] {
    switch (tenantUsers.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (not user.approved) { Runtime.trap("User not approved") };
        let natId = getTenantNatIdForDomain(user.domain);
        if (natId == 0) { return [] };
        controls.values().toArray().filter(func(c) {
          if (c.frameworkId != frameworkId) { return false };
          switch (ctrlTenantMap.get(c.id)) {
            case (?tid) { tid == natId };
            case (null) { false }; // seed data not shown to tenant users
          };
        });
      };
    };
  };

  public shared ({ caller }) func createComplianceControlAsTenantUser(userId : Text, input : CreateComplianceControlInput) : async Nat {
    switch (tenantUsers.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        if (not user.approved) { Runtime.trap("User not approved") };
        let natId = getOrCreateTenantNatIdForDomain(user.domain);
        let id = nextControlId;
        let control : ComplianceControl = {
          id;
          frameworkId = input.frameworkId;
          controlId = input.controlId;
          controlName = input.controlName;
          description = input.description;
          status = input.status;
          evidence = input.evidence;
          owner = input.owner;
          updatedAt = getCurrentTime();
        };
        controls.add(id, control);
        ctrlTenantMap.add(id, natId);
        nextControlId += 1;
        id;
      };
    };
  };

  // Admin creates a pre-approved tenant user
  public type AdminCreateTenantUserInput = {
    fullName : Text;
    email : Text;
    password : Text;
    companyName : Text;
    domain : Text;
    role : Text;
  };

  public shared ({ caller }) func createTenantUserByAdmin(input : AdminCreateTenantUserInput) : async RegistrationResult {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create tenant users");
    };
    switch (tenantUsersByEmail.get(input.email)) {
      case (?_) { return #userAlreadyExists };
      case (null) {};
    };
    let tenantOrgId = switch (tenantOrgs.get(input.domain)) {
      case (?existingOrg) { existingOrg.id };
      case (null) {
        let newOrgId = nextTenantOrgId.toText();
        let tenantOrg : TenantOrg = {
          id = newOrgId;
          companyName = input.companyName;
          domain = input.domain;
          createdAt = Time.now();
        };
        tenantOrgs.add(input.domain, tenantOrg);
        nextTenantOrgId += 1;
        newOrgId;
      };
    };
    ignore tenantOrgId;
    let userId = nextTenantUserId.toText();
    let tenantUser : TenantUser = {
      id = userId;
      fullName = input.fullName;
      email = input.email;
      passwordHash = input.password;
      companyName = input.companyName;
      domain = input.domain;
      role = input.role;
      approved = true; // pre-approved by admin
      createdAt = Time.now();
    };
    tenantUsers.add(userId, tenantUser);
    tenantUsersByEmail.add(input.email, tenantUser);
    nextTenantUserId += 1;
    #ok;
  };



  // ============================================================
  // TENANT SETTINGS & GRC CUSTOMIZATION
  // ============================================================

  public type RiskAppetite = {
    lowThreshold : Nat;
    mediumThreshold : Nat;
    highThreshold : Nat;
  };

  public type TenantSettings = {
    domain : Text;
    companyName : Text;
    industry : Text;
    activeFrameworks : [Text];
    riskAppetite : RiskAppetite;
    onboardingDone : Bool;
  };

  let tenantSettingsStore = Map.empty<Text, TenantSettings>();

  public query func getTenantSettings(domain : Text) : async ?TenantSettings {
    tenantSettingsStore.get(domain);
  };

  public shared ({ caller }) func saveTenantSettings(settings : TenantSettings) : async Bool {
    // Allow platform admin or any authenticated tenant user for their own domain
    tenantSettingsStore.add(settings.domain, settings);
    true;
  };

  // ============================================================
  // TENANT ONBOARDING
  // ============================================================

  public shared func completeTenantOnboarding(userId : Text, companyName : Text, industry : Text, activeFrameworks : [Text]) : async Bool {
    switch (tenantUsers.get(userId)) {
      case (null) { return false };
      case (?user) {
        let existing = switch (tenantSettingsStore.get(user.domain)) {
          case (?s) { s };
          case (null) {
            {
              domain = user.domain;
              companyName = companyName;
              industry = industry;
              activeFrameworks = activeFrameworks;
              riskAppetite = { lowThreshold = 3; mediumThreshold = 6; highThreshold = 9 };
              onboardingDone = true;
            };
          };
        };
        let updated : TenantSettings = {
          domain = existing.domain;
          companyName = companyName;
          industry = industry;
          activeFrameworks = activeFrameworks;
          riskAppetite = existing.riskAppetite;
          onboardingDone = true;
        };
        tenantSettingsStore.add(user.domain, updated);
        true;
      };
    };
  };

  public query func isTenantOnboardingDone(userId : Text) : async Bool {
    switch (tenantUsers.get(userId)) {
      case (null) { false };
      case (?user) {
        switch (tenantSettingsStore.get(user.domain)) {
          case (null) { false };
          case (?s) { s.onboardingDone };
        };
      };
    };
  };

  // ============================================================
  // CONTROL-GOVERNANCE LINKS (backend-persisted)
  // ============================================================

  public type ControlGovernanceLink = {
    tenantDomain : Text;
    controlId : Text;
    governanceItemIds : [Text];
  };

  let controlGovernanceLinks = Map.empty<Text, ControlGovernanceLink>();

  public shared func setControlGovernanceLink(tenantDomain : Text, controlId : Text, governanceItemIds : [Text]) : async Bool {
    let key = tenantDomain # ":" # controlId;
    let link : ControlGovernanceLink = { tenantDomain; controlId; governanceItemIds };
    controlGovernanceLinks.add(key, link);
    true;
  };

  public query func getControlGovernanceLinks(tenantDomain : Text) : async [ControlGovernanceLink] {
    controlGovernanceLinks.values().toArray().filter(func(l) { l.tenantDomain == tenantDomain });
  };

  public query func getControlGovernanceLink(tenantDomain : Text, controlId : Text) : async ?ControlGovernanceLink {
    let key = tenantDomain # ":" # controlId;
    controlGovernanceLinks.get(key);
  };

};

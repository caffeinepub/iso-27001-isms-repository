import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Set "mo:core/Set";
import VarArray "mo:core/VarArray";
import Principal "mo:core/Principal";



actor {
  include MixinStorage();

  // Extend authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
    email : Text;
    department : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Document Types
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

  // Risk Register Types
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

  // Compliance Frameworks and Controls Types
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

  // Storage
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

  // Helper functions
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

  // ISMS Initialization
  public shared ({ caller }) func initializeISMSRepository() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    // Pre-populate mandatory documents
    let seeds : [CreateDocumentInput] = [
      // Context of the Organization
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

  // GRC Initialization (including Compliance, Risks, Governance)
  public shared ({ caller }) func initializeGRCData() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    // Seed Compliance Frameworks
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

    // Seed Compliance Controls (3-5 per framework)
    let controlSeeds : [ComplianceControl] = [
      {
        id = 1;
        frameworkId = 1;
        controlId = "A.5.1";
        controlName = "Policies for information security";
        description = "Information security policy and topic-specific policies";
        status = #fullyImplemented;
        evidence = "ISMS Policy Document v2.0";
        owner = "CISO";
        updatedAt = getCurrentTime();
      },
      {
        id = 2;
        frameworkId = 1;
        controlId = "A.8.1";
        controlName = "User endpoint devices";
        description = "Information stored on, processed by or accessible via user endpoint devices";
        status = #partiallyImplemented;
        evidence = "Device management policy in draft";
        owner = "IT Manager";
        updatedAt = getCurrentTime();
      },
      {
        id = 3;
        frameworkId = 2;
        controlId = "CC6.1";
        controlName = "Logical and Physical Access Controls";
        description = "Access to system resources is restricted";
        status = #fullyImplemented;
        evidence = "Access control matrix and logs";
        owner = "Security Team";
        updatedAt = getCurrentTime();
      },
    ];

    for (control in controlSeeds.values()) {
      controls.add(control.id, control);
      nextControlId := control.id + 1;
    };

    // Seed Sample Risks
    let riskSeeds : [RiskItem] = [
      {
        id = 1;
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

    // Seed Sample Governance Items
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

  // Risk Register CRUD
  public shared ({ caller }) func createRisk(input : CreateRiskInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create risks");
    };

    let id = nextRiskId;
    let inherentRiskScore = input.likelihood * input.impact;
    let residualRiskScore = calculateResidualRiskScore(inherentRiskScore, input.mitigationControls);
    let riskLevel = determineRiskLevel(residualRiskScore);

    let risk : RiskItem = {
      id;
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
      status = #open;
      createdAt = getCurrentTime();
      updatedAt = getCurrentTime();
    };

    risks.add(id, risk);
    nextRiskId += 1;
    id;
  };

  public shared ({ caller }) func updateRisk(input : UpdateRiskInput) : async RiskItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update risks");
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
          id = existing.id;
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
          status = existing.status;
          createdAt = existing.createdAt;
          updatedAt = getCurrentTime();
        };

        risks.add(input.id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func deleteRisk(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete risks");
    };

    switch (risks.get(id)) {
      case (null) { Runtime.trap("Risk not found") };
      case (?_) {
        risks.remove(id);
      };
    };
  };

  public query ({ caller }) func getRisks() : async [RiskItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view risks");
    };
    risks.values().toArray();
  };

  public query ({ caller }) func getRiskById(id : Nat) : async ?RiskItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view risks");
    };
    risks.get(id);
  };

  public query ({ caller }) func getRiskStats() : async RiskStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view risk statistics");
    };

    let all = risks.values().toArray();
    let total = all.size();

    let low = all.filter(func(r) { r.riskLevel == #low }).size();
    let medium = all.filter(func(r) { r.riskLevel == #medium }).size();
    let high = all.filter(func(r) { r.riskLevel == #high }).size();
    let critical = all.filter(func(r) { r.riskLevel == #critical }).size();

    let open = all.filter(func(r) { r.status == #open }).size();
    let inTreatment = all.filter(func(r) { r.status == #inTreatment }).size();
    let closed = all.filter(func(r) { r.status == #closed }).size();

    let avgInherentScore = if (total == 0) { 0 } else {
      let sum = all.foldLeft(
        0,
        func(acc, risk) { acc + risk.inherentRiskScore },
      );
      sum / total;
    };

    let avgResidualScore = if (total == 0) { 0 } else {
      let sum = all.foldLeft(
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

  // Governance CRUD
  public shared ({ caller }) func createGovernanceItem(input : CreateGovernanceItemInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create governance items");
    };

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
    nextGovernanceId += 1;
    id;
  };

  public shared ({ caller }) func updateGovernanceItem(input : UpdateGovernanceItemInput) : async GovernanceItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update governance items");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view governance items");
    };
    governanceItems.values().toArray();
  };

  public query ({ caller }) func getGovernanceSummary() : async GovernanceSummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view governance summary");
    };

    let all = governanceItems.values().toArray();
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

  // Compliance CRUD
  public shared ({ caller }) func createComplianceControl(input : CreateComplianceControlInput) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create compliance controls");
    };

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
    nextControlId += 1;
    id;
  };

  public shared ({ caller }) func updateComplianceControl(input : UpdateComplianceControlInput) : async ComplianceControl {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update compliance controls");
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view compliance frameworks");
    };
    frameworks.values().toArray();
  };

  public query ({ caller }) func getComplianceControls(frameworkId : Nat) : async [ComplianceControl] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view compliance controls");
    };
    controls.values().toArray().filter(func(c) { c.frameworkId == frameworkId });
  };

  public query ({ caller }) func getComplianceScores() : async [ComplianceScores] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view compliance scores");
    };

    let results = List.empty<ComplianceScores>();

    for (framework in frameworks.values()) {
      let frameworkControls = controls.values().toArray().filter(
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
};

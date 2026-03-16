import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Array "mo:core/Array";
import VarArray "mo:core/VarArray";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Set "mo:core/Set";
import Runtime "mo:core/Runtime";

actor {
  include MixinStorage();

  // Extend authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type DocumentStatus = {
    #notStarted;
    #inProgress;
    #completed;
    #approved;
  };

  module DocumentStatus {
    public func compare(status1 : DocumentStatus, status2 : DocumentStatus) : Order.Order {
      let toNat = func(status : DocumentStatus) : Nat {
        switch (status) {
          case (#notStarted) { 0 };
          case (#inProgress) { 1 };
          case (#completed) { 2 };
          case (#approved) { 3 };
        };
      };
      Nat.compare(toNat(status1), toNat(status2));
    };
  };

  // Core data structures
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

  module Document {
    public func compareById(doc1 : Document, doc2 : Document) : Order.Order {
      Nat.compare(doc1.id, doc2.id);
    };

    public func compareByTitle(doc1 : Document, doc2 : Document) : Order.Order {
      Text.compare(doc1.title, doc2.title);
    };

    public func compareByStatus(doc1 : Document, doc2 : Document) : Order.Order {
      DocumentStatus.compare(doc1.status, doc2.status);
    };

    public func compareByClause(doc1 : Document, doc2 : Document) : Order.Order {
      Text.compare(doc1.clauseNumber, doc2.clauseNumber);
    };

    public func compareByControl(doc1 : Document, doc2 : Document) : Order.Order {
      Text.compare(doc1.controlNumber, doc2.controlNumber);
    };
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

  type DashboardStats = {
    total : Nat;
    byStatus : [(DocumentStatus, Nat)];
    byClause : [(Text, Nat)];
    completionPercent : Nat;
  };

  // Storage
  let documents = Map.empty<Nat, Document>();
  var nextId = 1;

  // Helper functions
  func getCurrentTime() : Int {
    Time.now();
  };

  public shared ({ caller }) func initializeISMSRepository() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    // Pre-populate mandatory documents
    let seeds : [CreateDocumentInput] = [
      // Clause 4 - Context of the Organization
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
      {
        title = "Information Security Policy Context";
        clauseNumber = "4.3";
        clauseName = "Context of the Organization";
        controlNumber = "";
        controlName = "";
        description = "Establishes the context for the information security policy";
        owner = "Management";
        fileId = null;
        isAnnexA = false;
      },
      // Clause 5 - Leadership
      {
        title = "Information Security Policy";
        clauseNumber = "5.2";
        clauseName = "Leadership";
        controlNumber = "";
        controlName = "";
        description = "Official information security policy document";
        owner = "Top Management";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Roles and Responsibilities";
        clauseNumber = "5.2";
        clauseName = "Leadership";
        controlNumber = "";
        controlName = "";
        description = "Defines roles and responsibilities for ISMS";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = false;
      },
      // Clause 6 - Planning
      {
        title = "Risk Assessment Procedure";
        clauseNumber = "6.1.2";
        clauseName = "Planning";
        controlNumber = "";
        controlName = "";
        description = "Procedure for assessing risks";
        owner = "Risk Manager";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Risk Treatment Plan";
        clauseNumber = "6.1.3";
        clauseName = "Planning";
        controlNumber = "";
        controlName = "";
        description = "Plan for treating identified risks";
        owner = "Risk Manager";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Statement of Applicability";
        clauseNumber = "6.1.3d";
        clauseName = "Planning";
        controlNumber = "";
        controlName = "";
        description = "Details the applicability of controls";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Information Security Objectives";
        clauseNumber = "6.2";
        clauseName = "Planning";
        controlNumber = "";
        controlName = "";
        description = "Defines the information security objectives";
        owner = "Top Management";
        fileId = null;
        isAnnexA = false;
      },
      // Clause 7 - Support
      {
        title = "Resources for ISMS";
        clauseNumber = "7";
        clauseName = "Support";
        controlNumber = "";
        controlName = "";
        description = "Documentation of resources allocated for ISMS";
        owner = "Top Management";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Competence Records";
        clauseNumber = "7";
        clauseName = "Support";
        controlNumber = "";
        controlName = "";
        description = "Records of competence assessments";
        owner = "HR";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Awareness Records";
        clauseNumber = "7";
        clauseName = "Support";
        controlNumber = "";
        controlName = "";
        description = "Records of awareness training";
        owner = "HR";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Communication Plan";
        clauseNumber = "7";
        clauseName = "Support";
        controlNumber = "";
        controlName = "";
        description = "Plan for internal and external communication";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Documented Information Control Procedure";
        clauseNumber = "7";
        clauseName = "Support";
        controlNumber = "";
        controlName = "";
        description = "Procedure for controlling documented information";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = false;
      },
      // Clause 8 - Operation
      {
        title = "Operational Planning";
        clauseNumber = "8";
        clauseName = "Operation";
        controlNumber = "";
        controlName = "";
        description = "Records of operational planning activities";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Risk Assessment Results";
        clauseNumber = "8";
        clauseName = "Operation";
        controlNumber = "";
        controlName = "";
        description = "Results of risk assessments";
        owner = "Risk Manager";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Risk Treatment Results";
        clauseNumber = "8";
        clauseName = "Operation";
        controlNumber = "";
        controlName = "";
        description = "Results of risk treatment activities";
        owner = "Risk Manager";
        fileId = null;
        isAnnexA = false;
      },
      // Clause 9 - Performance Evaluation
      {
        title = "Monitoring Procedures";
        clauseNumber = "9";
        clauseName = "Performance Evaluation";
        controlNumber = "";
        controlName = "";
        description = "Procedures for monitoring ISMS performance";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Internal Audit Program";
        clauseNumber = "9";
        clauseName = "Performance Evaluation";
        controlNumber = "";
        controlName = "";
        description = "Program for internal audits";
        owner = "Internal Auditor";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Internal Audit Results";
        clauseNumber = "9";
        clauseName = "Performance Evaluation";
        controlNumber = "";
        controlName = "";
        description = "Results of internal audits";
        owner = "Internal Auditor";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Management Review Records";
        clauseNumber = "9";
        clauseName = "Performance Evaluation";
        controlNumber = "";
        controlName = "";
        description = "Records of management reviews";
        owner = "Top Management";
        fileId = null;
        isAnnexA = false;
      },
      // Clause 10 - Improvement
      {
        title = "Nonconformity and Corrective Action Records";
        clauseNumber = "10";
        clauseName = "Improvement";
        controlNumber = "";
        controlName = "";
        description = "Records of nonconformities and corrective actions";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = false;
      },
      {
        title = "Continual Improvement Records";
        clauseNumber = "10";
        clauseName = "Improvement";
        controlNumber = "";
        controlName = "";
        description = "Records of continual improvement activities";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = false;
      },
      // Annex A Key Controls
      {
        title = "Organizational Policies";
        clauseNumber = "Annex A";
        clauseName = "Organizational Controls";
        controlNumber = "A.5";
        controlName = "Organizational Controls";
        description = "Policies for organization-wide information security";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "People Controls";
        clauseNumber = "Annex A";
        clauseName = "People Controls";
        controlNumber = "A.6";
        controlName = "People Controls";
        description = "Controls related to people and human resources";
        owner = "HR";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Physical Controls";
        clauseNumber = "Annex A";
        clauseName = "Physical Controls";
        controlNumber = "A.7";
        controlName = "Physical Controls";
        description = "Controls related to physical security";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Technological Controls";
        clauseNumber = "Annex A";
        clauseName = "Technological Controls";
        controlNumber = "A.8";
        controlName = "Technological Controls";
        description = "Controls related to technology and IT systems";
        owner = "IT Manager";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Access Control Policy";
        clauseNumber = "Annex A";
        clauseName = "Access Control";
        controlNumber = "A.8";
        controlName = "Access Control Policy";
        description = "Policy for managing access controls";
        owner = "IT Manager";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Asset Management Policy";
        clauseNumber = "Annex A";
        clauseName = "Asset Management";
        controlNumber = "A.8";
        controlName = "Asset Management Policy";
        description = "Policy for managing assets";
        owner = "IT Manager";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Cryptography Policy";
        clauseNumber = "Annex A";
        clauseName = "Cryptography";
        controlNumber = "A.8";
        controlName = "Cryptography Policy";
        description = "Policy for managing cryptography";
        owner = "IT Manager";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Supplier Security Policy";
        clauseNumber = "Annex A";
        clauseName = "Supplier Security";
        controlNumber = "A.8";
        controlName = "Supplier Security Policy";
        description = "Policy for managing supplier security";
        owner = "Purchasing";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Incident Response Procedure";
        clauseNumber = "Annex A";
        clauseName = "Incident Response";
        controlNumber = "A.8";
        controlName = "Incident Response Procedure";
        description = "Procedure for responding to security incidents";
        owner = "ISMS Manager";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Business Continuity Plan";
        clauseNumber = "Annex A";
        clauseName = "Business Continuity";
        controlNumber = "A.8";
        controlName = "Business Continuity Plan";
        description = "Plan for ensuring business continuity";
        owner = "Top Management";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Backup Policy";
        clauseNumber = "Annex A";
        clauseName = "Backup Management";
        controlNumber = "A.8";
        controlName = "Backup Policy";
        description = "Policy for managing backups";
        owner = "IT Manager";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Network Security Policy";
        clauseNumber = "Annex A";
        clauseName = "Network Security";
        controlNumber = "A.8";
        controlName = "Network Security Policy";
        description = "Policy for managing network security";
        owner = "IT Manager";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Change Management Procedure";
        clauseNumber = "Annex A";
        clauseName = "Change Management";
        controlNumber = "A.8";
        controlName = "Change Management Procedure";
        description = "Procedure for managing changes";
        owner = "IT Manager";
        fileId = null;
        isAnnexA = true;
      },
      {
        title = "Vulnerability Management Procedure";
        clauseNumber = "Annex A";
        clauseName = "Vulnerability Management";
        controlNumber = "A.8";
        controlName = "Vulnerability Management Procedure";
        description = "Procedure for managing vulnerabilities";
        owner = "IT Manager";
        fileId = null;
        isAnnexA = true;
      },
    ];

    for (seed in seeds.values()) {
      let doc : Document = {
        id = nextId;
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

      documents.add(nextId, doc);
      nextId += 1;
    };
  };

  public query ({ caller }) func getDocuments() : async [Document] {
    documents.values().toArray().sort(Document.compareById);
  };

  public query ({ caller }) func getDocumentById(id : Nat) : async Document {
    switch (documents.get(id)) {
      case (?doc) { doc };
      case (null) { Runtime.trap("Document not found") };
    };
  };
};

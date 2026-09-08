import { describe, expect, it } from "vitest";
import {
  SETUP_TABS,
  TAB,
  summarizeSetupProblems,
  validateSetup,
  validateSetupStep,
  type BranchInput,
  type CategoryInput,
  type SetupInput,
  type StaffInput,
} from "./setupValidation";

const blankBranch = (): BranchInput => ({
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  tables: [],
  tablesCount: 0,
  billing: { gstPercentage: "", serviceCharge: "" },
});

const blankCategory = (): CategoryInput => ({
  name: "",
  items: [{ name: "", price: "", prepTime: "" }],
});

const blankStaff = (): StaffInput => ({
  name: "",
  email: "",
  phone: "",
  hasLogin: false,
  password: "",
  salary: 0,
  joiningDate: "",
  shift: "",
  department: "",
});

const validInput = (): SetupInput => ({
  restaurant: {
    name: "Anna Bhavan",
    email: "owner@example.com",
    phone: "9876543210",
    address: "12 MG Road, Chennai",
    gst: "33AAAAA0000A1Z5",
  },
  branches: [{ ...blankBranch(), name: "Adyar" }],
  categories: [blankCategory()],
  staff: [blankStaff()],
  owner: { email: "owner@example.com", phone: "9876543210" },
});

const messages = (problems: { message: string }[]) => problems.map((p) => p.message);

describe("validateSetup", () => {
  it("accepts a complete restaurant with the untouched blank rows every step starts with", () => {
    expect(validateSetup(validInput())).toEqual([]);
  });

  describe("Restaurant Details", () => {
    it("names every missing required field by its on-screen label", () => {
      const input = validInput();
      input.restaurant.phone = "";
      input.restaurant.gst = "  ";
      input.restaurant.address = "";
      const problems = validateSetup(input);
      expect(problems).toEqual([
        { tab: TAB.details, message: "Phone Number, Address and GST Number are required." },
      ]);
    });

    it("uses singular wording for one missing field", () => {
      const input = validInput();
      input.restaurant.name = "";
      expect(messages(validateSetup(input))).toEqual(["Restaurant Name is required."]);
    });

    it("explains an invalid email, phone and GST number", () => {
      const input = validInput();
      input.restaurant.email = "owner-at-example";
      input.restaurant.phone = "12345";
      input.restaurant.gst = "GST123";
      expect(messages(validateSetup(input))).toEqual([
        'Email Address "owner-at-example" is not a valid email.',
        "Phone Number should be a 10-digit mobile number.",
        'GST Number "GST123" should be a 15-character GSTIN, like 22AAAAA0000A1Z5.',
      ]);
    });

    it("accepts a phone typed with a country code, spaces or dashes", () => {
      for (const phone of ["+91 98765 43210", "098765-43210", "98765 43210", "1111111111"]) {
        const input = validInput();
        input.restaurant.phone = phone;
        expect(validateSetup(input)).toEqual([]);
      }
    });
  });

  describe("Branch Setup", () => {
    it("requires at least one branch, since the dashboard cannot open without one", () => {
      const input = validInput();
      input.branches = [blankBranch(), blankBranch()];
      expect(validateSetup(input)).toEqual([
        {
          tab: TAB.branches,
          message:
            "Add at least one branch. Bills, tables and staff all belong to a branch, so the dashboard cannot open without one.",
        },
      ]);
    });

    it("flags a branch someone started but left unnamed, by its position", () => {
      const input = validInput();
      input.branches = [blankBranch(), { ...blankBranch(), city: "Chennai" }];
      expect(validateSetup(input)).toEqual([
        { tab: TAB.branches, message: "Branch 2 needs a Branch Name." },
      ]);
    });

    it("names the branch when checking its phone, email, pincode and tables", () => {
      const input = validInput();
      input.branches = [
        {
          ...blankBranch(),
          name: "Adyar",
          phone: "123",
          email: "adyar@",
          pincode: "60002",
          tablesCount: 2,
          tables: [
            { name: "", capacity: 4 },
            { name: "Window", capacity: 0 },
          ],
        },
      ];
      expect(messages(validateSetup(input))).toEqual([
        'Branch 1 ("Adyar"): Branch Phone should be a 10-digit number.',
        'Branch 1 ("Adyar"): Branch Email "adyar@" is not a valid email.',
        'Branch 1 ("Adyar"): Pincode should be 6 digits.',
        'Branch 1 ("Adyar"): table 1 needs a name.',
        'Branch 1 ("Adyar"): table 2 ("Window") needs a seating capacity of at least 1.',
      ]);
    });
  });

  describe("Menu Setup", () => {
    it("flags an unnamed category and incomplete dishes, naming what is known", () => {
      const input = validInput();
      input.categories = [
        {
          name: "",
          items: [
            { name: "Idli", price: "", prepTime: "" },
            { name: "", price: "40", prepTime: "" },
            { name: "Dosa", price: "abc", prepTime: "-5" },
            { name: "", price: "", prepTime: "" },
          ],
        },
      ];
      expect(messages(validateSetup(input))).toEqual([
        "Category 1 needs a name.",
        'Category 1: item 1 ("Idli") needs a Price.',
        "Category 1: item 2 needs an Item Name.",
        'Category 1: item 3 ("Dosa") has an invalid Price "abc".',
        'Category 1: item 3 ("Dosa") has an invalid Prep Time "-5".',
      ]);
    });

    it("includes the category name once it has one", () => {
      const input = validInput();
      input.categories = [{ name: "Starters", items: [{ name: "Vada", price: "", prepTime: "" }] }];
      expect(messages(validateSetup(input))).toEqual([
        'Category 1 ("Starters"): item 1 ("Vada") needs a Price.',
      ]);
    });
  });

  describe("Billing Settings", () => {
    it("checks percentages only on branches that exist", () => {
      const input = validInput();
      input.branches = [
        { ...blankBranch(), name: "Adyar", billing: { gstPercentage: "180", serviceCharge: "-1" } },
        { ...blankBranch(), billing: { gstPercentage: "999", serviceCharge: "" } },
      ];
      expect(validateSetup(input)).toEqual([
        { tab: TAB.billing, message: 'Branch 1 ("Adyar"): GST percentage should be between 0 and 100.' },
        { tab: TAB.billing, message: 'Branch 1 ("Adyar"): Service charge should be between 0 and 100.' },
      ]);
    });
  });

  describe("Staff Setup", () => {
    it("names the staff row and the fields it is missing", () => {
      const input = validInput();
      input.staff = [
        { ...blankStaff(), name: "Ravi" },
        { ...blankStaff(), email: "anu@example.com" },
      ];
      expect(messages(validateSetup(input))).toEqual([
        'Staff 1 ("Ravi") needs a Phone Number.',
        "Staff 2 needs a Full Name and a Phone Number.",
      ]);
    });

    it("catches two staff sharing a phone even when typed differently", () => {
      const input = validInput();
      input.staff = [
        { ...blankStaff(), name: "Ravi", phone: "9123456780" },
        { ...blankStaff(), name: "Anu", phone: "+91 91234 56780" },
      ];
      expect(messages(validateSetup(input))).toEqual([
        'Staff 1 ("Ravi") and Staff 2 ("Anu") have the same Phone Number.',
      ]);
    });

    it("accepts any ten digits and still catches the duplicate", () => {
      const input = validInput();
      input.staff = [
        { ...blankStaff(), name: "staff 1", phone: "1111111111" },
        { ...blankStaff(), name: "staff 1", phone: "1111111111" },
      ];
      expect(messages(validateSetup(input))).toEqual([
        'Staff 1 ("staff 1") and Staff 2 ("staff 1") have the same Phone Number.',
      ]);
    });

    it("catches two staff sharing an email regardless of case", () => {
      const input = validInput();
      input.staff = [
        { ...blankStaff(), name: "Ravi", phone: "9123456780", email: "Ravi@Example.com" },
        { ...blankStaff(), name: "Anu", phone: "9123456781", email: "ravi@example.com" },
      ];
      expect(messages(validateSetup(input))).toEqual([
        'Staff 1 ("Ravi") and Staff 2 ("Anu") have the same Email Address.',
      ]);
    });

    it("tells the owner when a staff row reuses their own login phone or email", () => {
      const input = validInput();
      input.staff = [
        { ...blankStaff(), name: "Ravi", phone: "98765 43210", email: "OWNER@example.com" },
      ];
      expect(messages(validateSetup(input))).toEqual([
        'Staff 1 ("Ravi") uses your own account\'s phone number; staff need their own.',
        'Staff 1 ("Ravi") uses your own account\'s email address; staff need their own.',
      ]);
    });

    it("requires a real password once Login Access is on", () => {
      const input = validInput();
      input.staff = [{ ...blankStaff(), name: "Ravi", phone: "9123456780", hasLogin: true, password: "1234" }];
      expect(messages(validateSetup(input))).toEqual([
        'Staff 1 ("Ravi") has Login Access on and needs a password of at least 6 characters.',
      ]);
      input.staff[0].password = "secret1";
      expect(validateSetup(input)).toEqual([]);
    });

    it("reports an assignment to a branch row that was left blank", () => {
      const input = validInput();
      input.branches = [{ ...blankBranch(), name: "Adyar" }, blankBranch()];
      input.staff = [
        { ...blankStaff(), name: "Ravi", phone: "9123456780", branchId: 0 },
        { ...blankStaff(), name: "Anu", phone: "9123456781", branchId: 1 },
      ];
      expect(messages(validateSetup(input))).toEqual([
        'Staff 2 ("Anu") is assigned to Branch 2, which is empty. Fill in that branch or choose another.',
      ]);
    });

    it("treats a row with only Login Access ticked as started", () => {
      const input = validInput();
      input.staff = [{ ...blankStaff(), hasLogin: true }];
      expect(messages(validateSetup(input))).toEqual([
        "Staff 1 needs a Full Name and a Phone Number.",
        "Staff 1 has Login Access on and needs a password of at least 6 characters.",
      ]);
    });
  });
});

describe("validateSetupStep", () => {
  it("checks only the requested step", () => {
    const input = validInput();
    input.restaurant.name = "";
    input.staff = [{ ...blankStaff(), name: "Ravi" }];
    expect(validateSetupStep(TAB.staff, input)).toEqual([
      { tab: TAB.staff, message: 'Staff 1 ("Ravi") needs a Phone Number.' },
    ]);
    expect(validateSetupStep(TAB.menu, input)).toEqual([]);
  });
});

describe("summarizeSetupProblems", () => {
  it("returns null when there is nothing to report", () => {
    expect(summarizeSetupProblems([])).toBeNull();
  });

  it("leads with the earliest step and prefixes its name", () => {
    const summary = summarizeSetupProblems([
      { tab: TAB.staff, message: "S." },
      { tab: TAB.details, message: "Phone Number is required." },
    ]);
    expect(summary).toEqual({
      tab: TAB.details,
      message: "Restaurant Details: Phone Number is required. Also check Staff Setup.",
    });
  });

  it("caps the messages shown and counts the rest, listing every other affected step once", () => {
    const summary = summarizeSetupProblems([
      { tab: TAB.menu, message: "A." },
      { tab: TAB.menu, message: "B." },
      { tab: TAB.menu, message: "C." },
      { tab: TAB.menu, message: "D." },
      { tab: TAB.menu, message: "E." },
      { tab: TAB.billing, message: "F." },
      { tab: TAB.staff, message: "G." },
      { tab: TAB.staff, message: "H." },
    ]);
    expect(summary).toEqual({
      tab: TAB.menu,
      message: `${SETUP_TABS[TAB.menu]}: A. B. C. And 2 more issues on this step. Also check Billing Settings and Staff Setup.`,
    });
  });
});

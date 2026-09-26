import { describe, expect, it } from "vitest";
import { csvField, toCsv } from "./csv";

describe("csv", () => {
  it("quotes commas, quotes, and newlines per RFC 4180", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField("a,b")).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField("two\nlines")).toBe('"two\nlines"');
    expect(csvField(null)).toBe("");
  });

  it("joins rows with CRLF", () => {
    expect(toCsv(["a", "b"], [[1, 2]])).toBe("a,b\r\n1,2\r\n");
  });
});

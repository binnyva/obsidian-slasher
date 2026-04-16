import test from "node:test";
import assert from "node:assert/strict";

import { trimShellOutput } from "../src/shell-output";

test("trimShellOutput removes surrounding whitespace", () => {
	assert.equal(trimShellOutput("\n  processed result  \n"), "processed result");
});

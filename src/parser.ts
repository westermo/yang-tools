import { parse as yangParse, SyntaxError } from './yang-stmt-parser';
import { Module, Submodule } from "./yang-ast";
import { Context } from "./yang-ast-builders";
import { parseModule, parseSubmodule } from './yang-ast-parser';

export type SuccessfulParse = {
	result: "success",
	module: Module | Submodule
}

export type SuccessfulParseWithWarnings = {
	result: "warning",
	module: Module | Submodule,
	warnings: string[]
}

export type UnsuccessfulParse = {
	result: "error",
	errors: string[],
	warnings: string[]
}

export type ParseResult = SuccessfulParse | SuccessfulParseWithWarnings | UnsuccessfulParse;

export type Parser = (sourceRef: string, input: string) => ParseResult;

export const parse: Parser = (sourceRef: string, input: string) => {
	let moduleOrSubmodule: Module | Submodule | null = null;
	let context: Context | null = null;

	try {
		const stmt = yangParse(sourceRef, input);
		context = new Context(stmt);

		if (stmt.prf !== "" || stmt.kw !== "module" && stmt.kw !== "submodule") {
			context.addError(`Expected to find a module or a submodule, but found ${stmt.prf ?? ""}${stmt.prf ? ":" : ""}${stmt.kw}.`);
		} else {
			moduleOrSubmodule = stmt.kw === "module" 
				? parseModule(context).build()
				: parseSubmodule(context).build();
		}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		return {
			result: "error",
			errors: [ error.message ?? "<unknown error>" ],
			warnings: []
		}
	}

	if (moduleOrSubmodule == null || context.errorCollection.messages.length > 0) {
		return {
			result: "error",
			errors: context.errorCollection.messages.length > 0 ? context.errorCollection.messages : ["unknown error"],
			warnings: context.warningCollection.messages
		}
	}

	if (context.warningCollection.messages.length > 0) {
		return {
			result: "warning",
			module: moduleOrSubmodule,
			warnings: context.warningCollection.messages
		}
	}

	return {
		result: "success",
		module: moduleOrSubmodule
	}
}

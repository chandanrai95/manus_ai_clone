import fs from 'fs';
import path from "path";
import { tool } from '@langchain/core/tools';
import { z } from "zod"

const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, 'public', "deep-agent");

export const write_file = tool(
    async ({ filename, content }, toolConfig: any) => {
        try {
            // Resolve absolute path inside your project
            const fullPath = path.join(BASE_DIR, filename);

            // Ensure directory exists
            await fs.promises.mkdir(path.dirname(fullPath), { recursive: true })

            // Write file (overwrite if exists)
            await fs.promises.writeFile(fullPath, content, "utf8");

            toolConfig.writer({
                write_file: "write_file",
                filename,
                content
            })
            console.log('triggered write_file --', { filename })

            return JSON.stringify({
                message: `Successfully wrote ${content.length} characters to ${filename}`
            })

        } catch (error: any) {
            return `Error writing file: ${error.message}`
        }
    },
    {
        name: "write_file",
        description: `Create or overwrite a file in the local filesystem.
        
IMPORTANT: The content parameter must be the COMPLETE file contents. 
Never truncate with placeholder comments like '// ...', '// rest of file', or 'exports ...'.
If the file is large, write it in full — do not summarize or abbreviate any section.`,
        schema: z.object({
            filename: z.string().describe("File name e.g: controllers/cartController.js"),
            content: z.string()
                .min(1, "Content cannot be empty")
                .describe("The COMPLETE file content. Must not contain truncation placeholders.")
        })
    }
)

export const grep = tool(
    async ({ pattern, path: searchPath = "." }) => {
        try {
            const fullPath = path.join(BASE_DIR, searchPath);

            const results: any = [];

            //Detect if pattern is regex
            let regex: any
            try {
                regex = new RegExp(pattern, "i");
            } catch {
                regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            }
            async function walk(dir: any) {
                const entries = await fs.promises.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const entryPath = path.join(dir, entry.name);

                    if (entry.isDirectory()) {
                        await walk(entryPath)
                    } else if (entry.isFile()) {
                        const content = await fs.promises.readFile(entryPath, "utf8");
                        const lines = content.split("\n");

                        lines.forEach((line, index) => {
                            if (regex.test(line)) {
                                results.push(
                                    `${path.relative(BASE_DIR, entryPath)}:${index + 1}: ${line.trim()}`
                                )
                            }
                        });
                    }
                }
            }

            await walk(fullPath)

            return results.length > 0
                ? results.join("\n")
                : "No matches found for pattern.";
        } catch (error: any) {
            return `Error during grep: ${error.message}`
        }
    },
    {
        name: "grep",
        description: "Search for a string or regex pattern inside file contents.",
        schema: z.object({
            pattern: z.string().describe("The string or regex to search for"),
            path: z.string().optional().describe("Relative path inside deep-agent folder")
        })
    }
)

export const read_file = tool(
    async ({ path : targetPath = '.', filename, offset = 0, limit = 100 }, toolConfig: any) => {
        try {
            const rootPath = path.resolve(BASE_DIR, targetPath)
            const resolvedPath = path.resolve(rootPath, filename);

            // Prevent directory traversal
            if (!resolvedPath.startsWith(BASE_DIR)) {
                throw new Error("Access outside allowed directory is not permitted.")
            }

            const content = await fs.promises.readFile(resolvedPath, "utf8");
            const lines = content.split("\n");

            const slice = lines.slice(offset, offset + limit);

            const formatted = slice
                .map((line, i) => `${(offset + i + 1).toString().padStart(4)} | ${line}`)
                .join("\n");

            if (offset + limit < lines.length) {
                const remaining = lines.length - (offset + limit);
                return `${formatted}\n\np[... ${remaining} more lines. Use offset=${offset + limit}]`
            }

            toolConfig.writer({
                read_file: "read_file",
                filename,
                content
            })

            return formatted;
        } catch (error: any) {
            return `Error while reading file: ${error.message}`
        }
    },
    {
        name: "read_file",
        description: "Read a file with line numbers. Use offset and limit for large files.",
        schema: z.object({
            path: z
                .string()
                .optional()
                .describe("Relative path inside deep-agent folder. Defaults to '.'"),
            filename: z.string().describe("filename to read"),
            offset: z.number().optional().default(0),
            limit: z.number().optional().default(1000)
        })
    }
)

export const edit_file = tool(
    async ({ filename, old_str, new_str }) => {
        try {
            const resolvedPath = path.resolve(BASE_DIR, filename);

            // Prevent directory traversal
            if (!resolvedPath.startsWith(BASE_DIR)) {
                throw new Error("Access outside allowed directory is not permitted.");
            }

            const content = await fs.promises.readFile(resolvedPath, "utf8");

            if (!content.includes(old_str)) {
                return `Error: Exact match for 'old_str' not found in ${filename}.No changes are applied.`
            }

            const updatedContent = content.replace(old_str, new_str);

            await fs.promises.writeFile(resolvedPath, updatedContent, "utf8");

            return `Successfulyy updated ${filename}.`
        } catch (error: any) {
            return `Error editing file: ${error.message}`
        }
    },
    {
        name: "edit_file",
        description: "Find and replace a specific string within a file.",
        schema: z.object({
            filename: z.string().describe("filename to edit"),
            old_str: z.string().describe("Exact text to find"),
            new_str: z.string().describe("Text to replace it with"),
        })
    }
)

export const ls = tool(
    async ({ path: targetPath = '.' }) => {
        try {
            const resolvedPath = path.resolve(BASE_DIR, targetPath);

            // Prevent directory traversal
            if (!resolvedPath.startsWith(BASE_DIR)) {
                throw new Error('Access outside allowed directory is not permitted.')
            }

            const entries = await fs.promises.readdir(resolvedPath, {
                withFileTypes: true
            })

            if (entries.length == 0) {
                return "Directory is empty."
            }

            const formatted = entries
                .map((entry) => {
                    if (entry.isDirectory()) return `${entry.name}/`
                    return entry.name;
                })
                .sort((a, b) => a.localeCompare(b))
                .join("\n");

            return formatted
        } catch (error: any) {
            return `Error while reading directory: ${error.message}`
        }
    },
    {
        name: 'ls',
        description: 'List files and directories at the given path.',
        schema: z.object({
            path: z
                .string()
                .optional()
                .describe("Relative path inside deep-agent folder. Defaults to '.'"),
        }),
    }
)

export const glob = tool(
    async ({ pattern = '.' }) => {
        try {
            // 1. Define the search root for the glob
            // We set 'cwd' to BASE_DIR so the agent doesn't search your whole PC
            const options = {
                cwd: BASE_DIR,
                exclude: (p: any) => p.includes("node_modules") // Optional: skip heavy folders
            }

            // const matches = []


            // 2. Use native node.js 22 glob (return as AsyncIterator)
            const matches = await new Promise<string[]>((resolve, reject) => {
                fs.glob(pattern, options, (err: any, entries: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve(entries);
                });
            });

            if (matches.length == 0) {
                return `No matches found for pattern "${pattern}" inside ${BASE_DIR}`;
            }

            return matches.join("\n")
        } catch (error: any) {
            console.error(`Error performing glob:`, error)
            return `Error performing glob: ${error.message}`
        }
    },
    {
        name: "glob",
        description: "Search for files on the local disk using wildcard patterns. (e.g., 'src/**/*.ts'). All searches are relative to the project root.",
        schema: z.object({
            pattern: z.string().describe('The glob pattern to match files.')
        })
    }
)

export const fileSystemTools = [write_file, read_file, edit_file, ls, grep, glob]
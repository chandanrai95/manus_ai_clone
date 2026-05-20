import fs from 'fs';
import path from 'path';
import { tool } from "@langchain/core/tools"
import { z } from "zod";
import { v4 as uuid } from "uuid";

const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "public", "deep-agent");
const TODO_FILE_NAME = `.todos-${Date.now()}.json`
const TODO_FILE = path.join(
    BASE_DIR,
    TODO_FILE_NAME
);

const InputTaskSchema = z.object({
    task: z.string(),
    assigned_to: z.string(),
    status: z
        .enum(["pending", "in_progress", "completed", "blocked"])
        .default("pending"),
    parent_id: z.string().optional(),
    dependencies: z.array(z.string()).optional()
});

const StoredTaskSchema = z.object({
    id: z.uuid(),
    task: z.string(),
    assigned_to: z.string(),
    status: z.enum(["pending", "in_progress", "completed", "blocked"]),
    parent_id: z.uuid().optional(),
    dependencies: z.array(z.uuid()).optional(),
    created_at: z.string(),
    updated_at: z.string()
})



export const write_todos = tool(
    async ({ filename, todos }, toolConfig: any) => {
        try {
            await fs.promises.mkdir(BASE_DIR, { recursive: true });
            const realFileName = `${filename}.todos.json`
            const filePath = path.join(BASE_DIR, realFileName);

            const now = new Date().toISOString();

            const enriched = todos.map((t) => ({
                id: uuid(),
                task: t.task,
                assigned_to: t.assigned_to,
                status: t.status ?? "pending",
                parent_id: t.parent_id,
                dependencies: t.dependencies ?? [],
                created_at: now,
                updated_at: now
            }))

            const jsonStringTodos = JSON.stringify(enriched, null, 2)

            await fs.promises.writeFile(
                filePath,
                JSON.stringify(enriched, null, 2),
                "utf8"
            )

            toolConfig.writer({
                todos: "todos",
                todoList: jsonStringTodos
            })

            return `<think>${{
                message: `TODO list saved file name : ${realFileName}`,
                tasks: enriched

            }}
            </think>`;
        } catch (error: any) {
            return `Error writing TODO list: ${error.message}`
        }
    },
    {
        name: "write_todos",
        description: `
    Creates or overwrites a workflow TODO list in the system.
    ### Purpose
    This tool allows the Manager agent to initialize a structured list of tasks for a work
    It ensures all tasks have unique IDs, proper timestamps, and consistent structure.
    It is the starting point for multi-stp worflows and subagent orchestration.

    ### Behavior
    - **UUID generation:** Each task is assigned a system-generated "id". The AI should not provide or modify task IDs.
    - **Timestamps:** "created_at" and "updated_at" are automatically set to the current date/time.
    - **Dependencies:** If not provided, "dependencies" defaults to an empty array.
    - **Status:** Defaults to "pending" if not specified.
    - **Parent-child hierarchy:** Supports optiona; "parent_id" for heirarchical worflows.
    - **File naming:** "filename" is the base name; the tool appends ".todos.json".

    ### Returned Output
    The tool returns:
    - "message": Confirmation including the generated file name.
    - "tasks": Full array of processed tasks including generated IDs, normalized status values, resolved dependencies, timestamps, and optional parent-child relationships. This allows AI agents or other tools to immediately reference, update, track, or orchestrate workflow execution without requiring additional task initialization.

    ### How to Use
    1. Provide a **base filename** (without extension).
    2. Provide a **array of tasks** with:
        - "task" (string)
        - "assigned_to" (subagent or "me")
        - Optional: "status", "dependecies", "parent_id"
    `,
        schema: z.object({
            filename: z.string().describe(
                "Base name of the TODO file (e.g., 'researchname-todo')." +
                "The tool automatically appends the proper file extension '.todos.json'." +
                "Do not include the extension yourself."
            ),
            todos: z.array(InputTaskSchema)
        })
    }
)

export const read_todos = tool(
    async ({ filename }) => {
        try {
            const filePath = path.join(BASE_DIR, filename);

            if (!fs.existsSync(filePath)) {
                return "No TODO list found."
            }

            const raw = await fs.promises.readFile(filePath, 'utf8');
            const todos = JSON.parse(raw);

            return JSON.stringify(todos, null, 2);
        } catch (error: any) {
            return `Error reading TODO list: ${error.message}`;
        }
    },
    {
        name: "read_todos",
        description: "Read a workflow TODO list.",
        schema: z.object({
            filename: z.string().describe("filename containing todolist")
        })
    }
)

export const update_todos = tool(
    async ({ filename, updates }, toolConfig: any) => {
        const filePath = path.join(BASE_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return "No TODO list found."
        }

        const raw = await fs.promises.readFile(filePath, 'utf8');
        const todos = JSON.parse(raw)

        updates.map((u) => {
            const index = todos.findIndex((t: any) => t.id == u.id)
            todos[index] = {
                ...todos[index],
                ...u,
                updated_at: new Date().toISOString(),
            }
        })

        await fs.promises.writeFile(
            filePath,
            JSON.stringify(todos, null, 2),
            "utf8"
        )

        toolConfig.writer({
                update_todos: "update_todos",
                updates: updates
            })

        return "<think>TODO list updated successfully.</think>";
    },
    {
        name: "update_todos",
        description: `
Updates tasks in a workflow TODO list by their unique IDs.

This tool is used when you want to:
- Change the status of a task (pending, in_progress, completed, blocked)
- Reassign a task to another agent
- Modify the task description

**Important Rules:**
1. The tool updates tasks strictly by UUID "id". Do NOT try to identify tasks by name or description.
2. Never use placeholder IDs such as "...", "task-1", "id", "unknown", or fake UUIDs.
3. update_todos requires updates[].id to be a valid UUID.
4. Only include fields that need to be changed. Fields not included remain unchanged.
5. The tool automatically updates the "updated_at" timestamp to the current time.
6. Dependencies cannot be modified with this tool — they are read-only in this context.
7. Only update TODO items using the exact UUID returned by the TODO list.
8. If you do not know the exact UUID, do not call update_todos.


CALL EXAMPLE:
{
  "filename": "todos-abc123.json",
  "updates": [
    { "id": "bf2807b0-ba95-4ca9-a511-f4011820600c", "status": "completed" },
    { "id": "ae9102c1-cc84-4b3e-b812-d1234567890a", "status": "in_progress", "assigned_to": "cart_agent" }
    { "id": "ae9102c1-cc84-4b3e-b812-d1234567890d", task: "Write the Hybrid Context Retriever documentation to a markdown file named hybrid_context_retriever.md" }
  ]
}

**Usage Notes for LLMs / Agents:**
- Always fetch the latest TODO list before updating to avoid overwriting changes.
- Only pass IDs returned by the "write_todos" or previously saved TODOs.
- Never try to guess UUIDs — hallucinating IDs will fail.

**Return Value:**
Returns a message confirming successful updates or an error message if the workflow or tasks could not be found.
        `,
        schema: z.object({
            filename: z.string().describe('filename containing todolist'),
            updates: z.array(
                z.object({
                    id: z.uuid().describe(
                        "The exact UUID of the TODO item to update. Must come from the existing TODO list. Never use placeholders like '...', 'task-1', or fake IDs."
                    ),
                    task: z.string().optional().describe("Updated task description text. Only include if changing the task name."),
                    assigned_to: z.string().optional().describe("Optional agent or role assigned to this task."),
                    status: z
                        .enum(["pending", "in_progress", "completed", "blocked"])
                        .optional()
                })
            )
        })
    }
)

export const get_next_runnable_tasks = tool(
    async ({ filename }) => {
        const filePath = path.join(BASE_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return "No TODO list found."
        }

        const raw = await fs.promises.readFile(filePath, 'utf8');
        const todos = JSON.parse(raw)

        // Build a map from task temp keys to IDs if needed
        const keyToIdMap: any = {};
        todos.forEach((t: any) => {
            if (t.key) keyToIdMap[t.key] = t.id
        });

        // Resolved dependencies (temp keys -> UUIDs)
        const runnable = todos.filter((t: any) => {
            if (t.status !== "pending") return false;
            const deps = t.dependecies || [];

            return deps.every((dep: any) => {
                // If dep is a temp key, map it to real ID
                const depId = keyToIdMap(dep) || dep;
                const parent = todos.find((x: any) => x.id === depId);
                return parent ? parent.status == "completed" : true;
            })
        })

        return JSON.stringify(runnable, null, 2);
    },
    {
        name: 'get_next_runnable_tasks',
        description: `
Scans a workflow's task list and computes the next set of executable tasks based on dependecies resolution rules.

The workflow is treated as a **Directed Acyclic Graph (DAG)**, where:
- Each task is a **node**.
- Dependencies represent **directed edges**.
- Execution must respect **topological order**: tasks can only run when all dependencies are completed.

---


### Runnable Task Criteria
A task is considered **runnable** if:
1. \`status === "pending"\`
2. AND either:
    - It has **no dependecies**, or
    - **All dependencies** (by ID or temp key) reference tasks with \`status === "completed"\`.
This evaluation is **read-only** and does **not mutate workflow state**.

---

### Why This Tool Exists
- Prevents executing tasks **out of order**, which could cause errors or inconsistent results.
- Ensures **execution safety** for multi-step workflows.
- Enables structured reasoning and **autonomous agent loops**.

---

### Features
- Returns **multiple runnable tasks** for parallel execution.
- Supports **hierarchical workflows** via \`parent_id\`.
- Integrates with **multi-agent systems** via \`skill_required\`.
- Safe for **autonomous loop execution**.

---

### Recommended Agent Execution Loop
\`\`\`python
while True:
    runnable = get_next_runnable_tasks(filename="my_workflow.todos.json")

    if not runnable:
        break

    for task in runnable:
        route_to_skill(task.skill_required)
        execute(task)

        update_todos(
            workflow_id,
            updates=[
                {
                    "id": task.id,
                    "status": "completed"
                }
            ]
        )
\`\`\`

---

### Few-Shot Usage Examples

**Example 1: Simple runnable task**
\`\`\`json
{
  "filename": "rag-blog-workflow-001.todos.json"
}
\`\`\`
Returns:
\`\`\`json
[
  {
    "id": "def42a16-d188-4357-96a8-39d55fc8752b",
    "task": "Generate TypeScript code examples using LangChain",
    "status": "pending",
    "dependencies": ["60b9a4ca-1960-401e-b107-40e2fe1e35ad"],
    "assigned_to": "typescript_expert"
  }
]
\`\`\`

---

**Example 2: Multiple runnable tasks in parallel**
\`\`\`json
{
  "filename": "data-pipeline-workflow.todos.json"
}
\`\`\`
Returns:
\`\`\`json
[
  {
    "id": "task-101",
    "task": "Download dataset",
    "status": "pending",
    "dependencies": [],
    "assigned_to": "downloader"
  },
  {
    "id": "task-102",
    "task": "Validate schema",
    "status": "pending",
    "dependencies": [],
    "assigned_to": "validator"
  }
]
\`\`\`

---

**Example 3: Dependency-resolved task**
\`\`\`json
{
  "filename": "rag-blog-workflow-001.todos.json"
}
\`\`\`

Returns:
\`\`\`json
[
  {
    "id": "bf28b7b6-ba93-4ca9-a311-f461182606bc",
    "task": "Write SEO-optimized blog draft",
    "status": "pending",
    "dependencies": [
      "bbe944de-5ca5-47ea-bc55-79bbff9a3217",
      "def42a16-d188-4357-96a8-39d55fc8752b"
    ],
    "assigned_to": "blog_writer"
  }
]
\`\`\`

---

### Notes for LLMs / Agents
- **Always use UUIDs** or maintain a mapping from human-readable keys to task IDs.
- Do **not hallucinate IDs** — tasks with unknown or unresolved dependencies may be skipped.
- Use this tool **before routing tasks** to subagents or skills.
- Supports **parallel execution**: multiple tasks may be returned if dependency conditions are satisfied.

Returns an **array of task objects** that are safe and ready to execute at the current workflow state.

`,
        schema: z.object({
            filename: z.string().describe('filename containing todolist'),
        })
    }
)

export const todoListTools = [read_todos, update_todos, write_todos, get_next_runnable_tasks]
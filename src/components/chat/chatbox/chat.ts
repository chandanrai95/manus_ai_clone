export const chatMessages = [
  {
    role: "user",
    userId: "6964dad99b60669a3e261f02",
    projectId: "69690e589eaeb9de331dd528",
    content: "hello",
  },
  {
    role: "ai",
    userId: "6964dad99b60669a3e261f02",
    projectId: "69690e589eaeb9de331dd528",
    content: "\n\nHello! How can I assist you today?",
    thinking:
      '\nOkay, the user said "hello". That\'s a greeting. I should respond politely and offer help.',
  },
  {
    role: "user",
    userId: "6964dad99b60669a3e261f02",
    projectId: "69690e589eaeb9de331dd528",
    content: "Can you help me build a Next.js app?",
  },
  {
    role: "ai",
    userId: "6964dad99b60669a3e261f02",
    projectId: "69690e589eaeb9de331dd528",
    content:
      "Absolutely! I can help you create a Next.js app step by step. Do you want App Router or Pages Router?",
    thinking:
      "The user wants help building a Next.js app. I should ask a clarifying question about the router type before generating code.",
  },
  {
    role: "user",
    userId: "6964dad99b60669a3e261f02",
    projectId: "69690e589eaeb9de331dd528",
    content: "Use App Router with TypeScript and Tailwind.",
  },
  {
    role: "ai",
    userId: "6964dad99b60669a3e261f02",
    projectId: "69690e589eaeb9de331dd528",
    content:
      "Great choice. You can create the project using:\n\nnpx create-next-app@latest my-app --typescript --tailwind --app",
    thinking:
      "The user already specified the stack. I should provide the exact command to bootstrap the app.",
  },
  {
    role: "user",
    userId: "6964dad99b60669a3e261f02",
    projectId: "69690e589eaeb9de331dd528",
    content: "Can you also add authentication?",
  },
  {
    role: "ai",
    userId: "6964dad99b60669a3e261f02",
    projectId: "69690e589eaeb9de331dd528",
    content:
      "Yes. I recommend using NextAuth.js for authentication with Google login support.",
    thinking:
      "The user wants authentication. NextAuth.js is the standard solution for Next.js authentication.",
  },
  {
    role: "user",
    userId: "6964dad99b60669a3e261f02",
    projectId: "69690e589eaeb9de331dd528",
    content: "Show me the folder structure.",
  },
  {
    role: "ai",
    userId: "6964dad99b60669a3e261f02",
    projectId: "69690e589eaeb9de331dd528",
    content:
      "src/\n ├── app/\n ├── components/\n ├── lib/\n ├── services/\n ├── models/\n └── styles/",
    thinking:
      "The user requested a folder structure. Keep it concise and readable.",
  },
];
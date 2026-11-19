import { Goal, Task, Capture } from "@keystone/core";
export function demoData(now = new Date()): {
  goals: Goal[];
  tasks: Task[];
  captures: Capture[];
} {
  const due = (days: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const goals: Goal[] = [
    {
      id: "demo-semester",
      title: "Finish the semester strong",
      area: "academics",
      horizon: "short",
      notes: "One assignment at a time.",
    },
    {
      id: "demo-career",
      title: "Land a summer internship",
      area: "career",
      horizon: "long",
      notes: "Build a thoughtful shortlist, then apply.",
    },
    {
      id: "demo-skills",
      title: "Get comfortable with interviews",
      area: "skills",
      horizon: "long",
      notes: "Consistent practice over cramming.",
    },
    {
      id: "demo-health",
      title: "Make room for feeling good",
      area: "health",
      horizon: "short",
      notes: "A little movement, a clearer mind.",
    },
  ];
  const specs: [
    string,
    string,
    Task["area"],
    string,
    number,
    number,
    number,
    number,
  ][] = [
    ["os", "Finish OS assignment", "academics", "demo-semester", 1, 16, 3, 45],
    [
      "dbms",
      "Review for the DBMS quiz",
      "academics",
      "demo-semester",
      2,
      10,
      2,
      25,
    ],
    [
      "intern",
      "Apply to two internships",
      "career",
      "demo-career",
      1,
      18,
      3,
      30,
    ],
    [
      "code",
      "Solve one LeetCode problem",
      "skills",
      "demo-skills",
      0,
      20,
      2,
      20,
    ],
    ["gym", "Head to the gym", "health", "demo-health", 2, 18, 1, 40],
  ];
  const tasks: Task[] = specs.map(
    ([id, title, area, goalId, days, hour, priority, minutes]) => ({
      id: `demo-${id}`,
      title,
      area,
      goalId,
      dueDate: due(days, hour),
      priority,
      minutes,
      status: "todo",
      notes: "",
      captureId: "demo-capture",
    }),
  );
  tasks.push({
    id: "demo-done",
    title: "Make a shortlist of internships",
    area: "career",
    goalId: "demo-career",
    priority: 2,
    minutes: 15,
    status: "done",
    notes: "",
    captureId: "demo-capture",
    completedAt: now.toISOString(),
  });
  return {
    goals,
    tasks,
    captures: [
      {
        id: "demo-capture",
        text: "OS assignment, DBMS quiz, internships, LeetCode and gym",
        source: "text",
        createdAt: now.toISOString(),
        processed: true,
      },
    ],
  };
}

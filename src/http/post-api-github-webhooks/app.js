module.exports = (app) => {
  // Log a message when the app is loaded
  app.log.info("Yay! The app was loaded!");

  // Handler for issues
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue! We will look into it ASAP.",
    });

    // Add a comment to the newly opened issue
    await context.octokit.issues.createComment(issueComment);

    // Automatically label the issue
    const labels = context.issue({ labels: ["triage"] });
    await context.octokit.issues.addLabels(labels);

    // Assign the issue to a user
    const assignees = context.issue({ assignees: ["username"] });
    await context.octokit.issues.addAssignees(assignees);
  });

  // Handler for pull requests
  app.on(["pull_request.opened", "pull_request.edited"], async (context) => {
    const prBody = context.payload.pull_request.body;
    const checklistRegex = /-\s\[( |x)\]\s/g;
    const matches = prBody.match(checklistRegex);

    if (matches) {
      const isComplete = matches.every((match) => match === '- [x] ');

      if (isComplete) {
        await context.octokit.pulls.createReview({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          pull_number: context.payload.pull_request.number,
          event: "APPROVE",
          body: "All checklist items are complete. Approving the pull request.",
        });
      } else {
        await context.octokit.pulls.createReview({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          pull_number: context.payload.pull_request.number,
          event: "REQUEST_CHANGES",
          body: "Please complete all checklist items before we can approve this pull request.",
        });
      }
    } else {
      await context.octokit.issues.createComment(context.issue({
        body: "Please ensure your pull request includes a checklist."
      }));
    }
  });

  // Handler for commenting on issues based on keywords
  app.on("issues.edited", async (context) => {
    const issue = context.payload.issue;
    const keywords = ["urgent", "immediate attention"];

    if (keywords.some((keyword) => issue.body.includes(keyword))) {
      const keywordComment = context.issue({
        body: "This issue contains keywords that require immediate attention.",
      });

      // Add a comment if the issue body contains specific keywords
      await context.octokit.issues.createComment(keywordComment);
    }
  });
};
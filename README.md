# Habit Tracker Web App (A Project to Learn Typescript)

### Habit Management:

- Create, Edit, and Delete Habits:
  - Each habit will have:
    - Name (e.g., "Exercise")
    - Frequency (e.g., "Twice a week," "Every Monday and Friday")
    - Description (optional)
- TypeScript Practice:
  - Defined a Habit interface that includes a union frequency field.
  - Used string literals for predefined frequency options and a custom frequency object for more flexible scheduling.
- Learning Points: Work with string literals and enums for frequency options, and practice managing optional properties.

### Completion Tracking:

- Users will track their completion based on the specified frequency. For example, if a user sets a habit to be done "Twice a week," they can mark their completion for those days.
- TypeScript Practice:
  - Implemented a method (markAsCompleted) to handle completion tracking with array manipulation to check if the habit has already been completed today, and conditional logic to ensure habits are completed only on allowed days.
- Learning Points: Use conditional logic and array manipulation to manage completion states.

### Filtering Habits by Completion Status:

 - Display habits in two sections:
   - Needs Completion Today (habits that need to be completed today based on their frequency).
   - Does Not Need Completion Today (habits that don’t need to be completed today).
- TypeScript Practice:
  - Used array filtering to separate habits based on their completion status for the current day.
- Learning Points: Work with date comparisons and conditional filtering to show relevant habits for today.

### Local Storage:

- Save habits with their frequencies and completion status, allowing users to return to their data later.
- TypeScript Practice:
  - Implemented JSON parsing and stringifying to store and retrieve data from local storage.
  - Handled nullable types (e.g., optional description field and custom frequency) to ensure the application functions even if some properties are missing.
- Learning Points: Practice working with JSON and handling nullable types.

*(Chat-gpt generated points)*

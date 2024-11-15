interface Habit {
    name: string;
    frequency: Frequency; // FIXME: make this into its own enum later
    completions: number;
    completionDates: string[];
}

type Frequency = "Daily" | "Weekly" | "Twice a Week" | "Custom"

interface CustomFrequency {
    days: string[]; // e.g., ['Monday', 'Wednesday']
  }

const habits: Habit[] = loadFromStorage(); // loads as json data?

// get references to the DOM elements
const habitForm = document.getElementById('habit-form') as HTMLFormElement;
const habitInput = document.getElementById('habit-input') as HTMLInputElement;
const frequencyInput = document.getElementById('frequency-input') as HTMLSelectElement;
const customFrequencyInput = document.getElementById('custom-frequency-input') as HTMLDivElement;
const habitList = document.getElementById('habit-list') as HTMLUListElement;

habits.forEach(habit => addHabit(habit)); // AFTER the DOM elements so it knows what to reference

frequencyInput.addEventListener('change', () => {
    if (frequencyInput.value === "Custom") {
        customFrequencyInput.style.display = "block"; // Show custom frequency options
    } else {
        customFrequencyInput.style.display = "none"; // Hide custom frequency options
    }
});

habitForm.addEventListener('submit', (event) => {
    event.preventDefault(); // prevent page refresh on form submission
    const habitName = habitInput.value.trim(); // trim removes leading/trailing whitespace
    const habitFrequency = frequencyInput.value as Frequency;

    if (habitName.length > 0 && habitFrequency.length > 0) {
        const newHabit: Habit = {name: habitName, frequency: habitFrequency, completions: 0, completionDates: []};
        habits.push(newHabit);
        addHabit(newHabit);
        storeLocally(habits);

        habitInput.value = '';
        frequencyInput.value = '';
    } else {
        alert('Please fill out all fields.');
    }
});

function addHabit(newHabit: Habit) {
    const li = document.createElement('li'); // makes a new list element in the html
    li.textContent = `${newHabit.name} (${newHabit.frequency}) - Completed: ${newHabit.completions}`;

    // mark as completed button
    const completeButton = document.createElement('button');
    completeButton.textContent = 'Complete'
    completeButton.addEventListener('click', () => markAsCompleted(newHabit));

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
        li.remove();
        
        // find habit in array
        const index = habits.indexOf(newHabit);
        if (index > -1) {
            habits.splice(index, 1); // splice removes or adds elements based on parameters
        }

        // update local storage
        storeLocally(habits);
    });

    li.appendChild(completeButton);
    li.appendChild(deleteButton);
    habitList.appendChild(li);
}

function markAsCompleted(habit: Habit) {
    const today = new Date().toISOString().split('T')[0];
    if (!habit.completionDates.includes(today)) {
        habit.completionDates.push(today);
        habit.completions++;
        storeLocally(habits);
        alert(`Habit ${habit.name} completed.`);
    } else {
        alert(`You've already completed ${habit.name} today.`);
    }
}

// save habits to local storage
function storeLocally(habits: Habit[]) {
    localStorage.setItem('habits', JSON.stringify(habits));
}

function loadFromStorage(): Habit[] {
    const storedHabits = localStorage.getItem('habits');
    return storedHabits ? JSON.parse(storedHabits) : [];
}
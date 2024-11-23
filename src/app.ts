type Frequency = "Daily" | "Weekly" | "Twice a Week" | "Custom"; // literal type best here? unknown

interface CustomFrequency {
    days: string[]; 
}

interface Habit {
    name: string;
    frequency: Frequency | CustomFrequency; // this ended up making some things weird later on, maybe better ways to approach this
    completions: number;
    completionDates: string[];
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
    const selectedFrequency = frequencyInput.value;

    if(!habitName) {
        alert('Please enter a habit name.');
        return;
    }

    let habit: Habit;

    if(selectedFrequency === "Custom") {
        const selectedDays = Array.from(document.querySelectorAll('#custom-frequency-input input:checked'))
            .map((checkbox) => (checkbox as HTMLInputElement).value); // Get selected days
        if (selectedDays.length === 0) {
            alert('Please select at least one day for the custom frequency.');
            return;
        }

        habit = {
            name: habitName,
            frequency: {days: selectedDays}, // sets as CustomFrequency
            completions: 0,
            completionDates: [],
        }
    } else {
        habit = {
            name: habitName,
            frequency: selectedFrequency as Frequency,
            completions: 0,
            completionDates: [],
        }
    }

    habits.push(habit);
    addHabit(habit);
    storeLocally(habits);
    habitForm.reset();
    customFrequencyInput.style.display = 'none';
});

function addHabit(newHabit: Habit) {
    const li = document.createElement('li'); // makes a new list element in the html
    li.setAttribute('data-habit-name', newHabit.name); // Add data-habit-name to uniquely identify the habit

    const habitText = document.createElement('span');
    let frequencyText = "";

    if (isCustomFrequency(newHabit)) {
        frequencyText = `Custom (${newHabit.frequency.days.join(", ")})`;
    } else {
        frequencyText = newHabit.frequency as Frequency;
    }
    habitText.textContent = `${newHabit.name} (${frequencyText})`;

    const completionText = document.createElement('span');
    completionText.className = 'completion-text';
    completionText.textContent = `Completed: ${newHabit.completions}`;

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
    
    li.appendChild(habitText);
    li.appendChild(completionText);
    li.appendChild(completeButton);
    li.appendChild(deleteButton);
    habitList.appendChild(li);
}

// add a typeguard to make sure if statement in markascompleted works
function isCustomFrequency(habit: Habit): habit is Habit & { frequency: CustomFrequency } {
    return typeof habit.frequency === "object" && "days" in habit.frequency;
}

function markAsCompleted(habit: Habit) {
    const todayDate = new Date();
    const todayDay = todayDate.toLocaleString('en-US', { weekday: 'long' });

    if (isCustomFrequency(habit)) {
        if (!habit.frequency.days.includes(todayDay)) {
            alert(`This habit cannot be completed today (${todayDay}). Allowed days: ${habit.frequency.days.join(', ')}`);
            return;
        }
    }
    
    const today = new Date().toISOString().split('T')[0]; // iso format is YYYY-MM-DDTHH:mm:ss.sssZ
    if (!habit.completionDates.includes(today)) {
        habit.completionDates.push(today);
        habit.completions++;
        storeLocally(habits);

        const habitItem = document.querySelector(`li[data-habit-name="${habit.name}"]`);
        if (habitItem) {
            // Find the completion text span and update its content
            const completionText = habitItem.querySelector('.completion-text');
            if (completionText) {
                completionText.textContent = `Completed: ${habit.completions}`;
            }
        }

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
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
displayHabits(habits, new Date());

frequencyInput.addEventListener('change', () => {
    if (frequencyInput.value === "Custom") {
        customFrequencyInput.style.display = "block"; // Show
    } else {
        customFrequencyInput.style.display = "none"; // Hide
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
    displayHabits(habits, new Date());
    habitForm.reset();
});

function addHabit(newHabit: Habit) {
    const li = document.createElement('li'); // makes a new list element in the html
    li.setAttribute('data-habit-name', newHabit.name); 
    li.setAttribute('data-habit-frequency', JSON.stringify(newHabit.frequency));
    li.setAttribute('data-habit-completions', newHabit.completions.toString());

    const habitText = document.createElement('span');
    let frequencyText = "";

    if (isCustomFrequency(newHabit)) {
        frequencyText = `${newHabit.frequency.days.join(", ")}`;
    } else {
        frequencyText = newHabit.frequency as Frequency;
    }
    habitText.textContent = `${newHabit.name} (${frequencyText})`;

    // completed text info
    const completionText = document.createElement('span');
    completionText.className = 'completion-text';
    completionText.textContent = `Completed: ${newHabit.completions}`;

    // mark as completed button
    const completeButton = document.createElement('button');
    completeButton.textContent = 'Complete'
    completeButton.addEventListener('click', () => {
        markAsCompleted(newHabit);
        displayHabits(habits, new Date());
    });

    // delete button
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

        storeLocally(habits);
        displayHabits(habits, new Date());
    });

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
    buttonGroup.appendChild(completionText);
    buttonGroup.appendChild(completeButton);
    buttonGroup.appendChild(deleteButton);
    
    li.appendChild(habitText);
    li.appendChild(buttonGroup);

    const allHabits = document.getElementById('habit-list');
    if (allHabits) {
        allHabits.appendChild(li);
    }
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
        displayHabits(habits, new Date());

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

function needsCompletionToday(habit: Habit, today: Date): boolean {
    const todayISO = today.toISOString().split('T')[0];
    const todayDay = today.toLocaleString('en-US', { weekday: 'long' });
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    if (habit.frequency === "Daily") { 
        return !habit.completionDates.includes(todayISO);
    } else if (habit.frequency === "Weekly") {
        if (dayOfWeek === 6) {
            return isCompletedThisWeek(habit, today) === 0;
        }
    } else if (habit.frequency === "Twice a Week") {
        const completionsSoFar = isCompletedThisWeek(habit, today);
        if (dayOfWeek === 5) { // if it is the last day of week and it hasn't been completed yet, it needs to be completed
            return completionsSoFar < 1;
        }
        if (dayOfWeek === 6) { // if it is the last day of week and it has only been completed once, it needs to be completed
            return completionsSoFar < 2 && !habit.completionDates.includes(todayISO);
        }
    } else if (isCustomFrequency(habit)) {
        if (habit.frequency.days.includes(todayDay)) {
            return !habit.completionDates.includes(todayISO);
        }
    }

    return false;
}

function filterHabits(habits: Habit[], today: Date) {
    const needsCompletion = habits.filter(habit => needsCompletionToday(habit, today));
    const doesNotNeedCompletion = habits.filter(habit => !needsCompletion.includes(habit));

    return {needsCompletion, doesNotNeedCompletion}; // return in form of an object
}

function displayHabits(habits: Habit[], today: Date) {
    const {needsCompletion, doesNotNeedCompletion} = filterHabits(habits, today);

    const needsCompletionList = document.getElementById("needs-completion-list")!;
    const doesNotNeedCompletionList = document.getElementById("does-not-need-completion-list")!;
    const allHabits = document.getElementById('all-habits') as HTMLElement;
    const completedMessage = document.getElementById('completed-message') as HTMLElement;

    if (needsCompletion.length === 0) {
        completedMessage.style.display = "block";
    } else {
        completedMessage.style.display = "none";
    }

    needsCompletion.forEach(habit => {
        const listItem = allHabits.querySelector(`li[data-habit-name="${habit.name}"]`);
        if (listItem && listItem.parentElement !== needsCompletionList) {
            needsCompletionList.appendChild(listItem);
        }
    });

    doesNotNeedCompletion.forEach(habit => {
        const listItem = allHabits.querySelector(`li[data-habit-name="${habit.name}"]`);
        if (listItem && listItem.parentElement !== doesNotNeedCompletionList) {
            doesNotNeedCompletionList.appendChild(listItem);
        }
    });

}

function isCompletedThisWeek(habit: Habit, today: Date) {
    const weekStart = new Date(today); // start with date in YYYY-MM-DD
    weekStart.setDate(today.getDate() - today.getDay()); // set to the beginning of the week 

    const weekEnd = new Date(today); 
    weekEnd.setDate(today.getDate() + (6 - today.getDay())); // set to end of the week

    const weekCompleted = habit.completionDates.filter(date => {
        const dateObj = new Date(date); // turn today's date into the YYYY-MM-DD format

        // check if the date is within this week and not today
        return (
            dateObj >= weekStart && dateObj <= weekEnd && dateObj.getDay() !== today.getDay()
        );
    });
    return weekCompleted.length;
}

// save habits to local storage
function storeLocally(habits: Habit[]) {
    localStorage.setItem('habits', JSON.stringify(habits));
}

function loadFromStorage(): Habit[] {
    const storedHabits = localStorage.getItem('habits');
    return storedHabits ? JSON.parse(storedHabits) : [];
}
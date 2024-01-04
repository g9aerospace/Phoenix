// sites/script.js

// Initialize an array to store selected games
const selectedGames = [];

// Function to record user response and proceed to the next page
function recordResponse(response) {
  // Save the user's response
  const userResponse = { code: sessionCode, response: response };

  // Display a confirmation and proceed to the next step
  alert(`Your response is recorded: ${response}`);

  // Fetch game options from assets/games.json and dynamically populate the form
  fetch('assets/games.json')
    .then(response => response.json())
    .then(data => {
      const gamesForm = document.getElementById('authForm');

      // Clear existing content in the form
      gamesForm.innerHTML = '';

      // Display the game options
      data.forEach(game => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'games';
        checkbox.value = game;
        const label = document.createElement('label');
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(game));
        gamesForm.appendChild(label);
      });

      // Add a submit button
      const submitButton = document.createElement('button');
      submitButton.type = 'button';
      submitButton.textContent = 'Submit';
      submitButton.onclick = submitGames;
      gamesForm.appendChild(submitButton);
    })
    .catch(error => console.error('Error fetching games:', error));
}

// Function to submit selected games
function submitGames() {
  // Get selected games
  const checkboxes = document.getElementsByName('games');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      selectedGames.push(checkbox.value);
    }
  });

  // Display a confirmation with selected games
  alert('Games submitted successfully. Selected games: ' + selectedGames.join(', '));
  // You can further process and save the user's selected games
}

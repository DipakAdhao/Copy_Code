let editor;
let snippets = [];

document.addEventListener('DOMContentLoaded', () => {
  editor = CodeMirror.fromTextArea(document.getElementById('code'), {
    lineNumbers: true,
    mode: 'javascript' // Default mode
  });

  loadLanguages(); // Load languages for sidebar
  loadSnippets(); // Load snippets initially

  document.getElementById('saveSnippet').addEventListener('click', saveSnippet);
  document.getElementById('clearEditor').addEventListener('click', clearEditor);
});

function saveSnippet() {
  const title = document.getElementById('snippetTitle').value.trim();
  const language = document.getElementById('snippetLanguage').value.trim();
  const tags = document.getElementById('snippetTags').value.split(',').map(tag => tag.trim());
  const code = editor.getValue().trim();

  if (!title || !language || !code) {
    alert('Please fill in all fields: Snippet Title, Language, and Code.');
    return;
  }

  let snippetExists = false;
  snippets.forEach((snippet, index) => {
    if (snippet.title === title && snippet.language === language) {
      snippets[index] = { title, language, tags, code };
      snippetExists = true;
    }
  });

  if (!snippetExists) {
    snippets.push({ title, language, tags, code });
  }

  chrome.storage.sync.set({ snippets }, () => {
    alert('Snippet saved successfully!');
    clearInputs();
    loadSnippets();
    loadLanguages(); // Refresh language list
  });
}

function loadLanguages() {
  chrome.storage.sync.get('snippets', (data) => {
    snippets = data.snippets || [];

    const languageList = document.getElementById('languageList');
    languageList.innerHTML = '';

    // Extract unique languages from snippets
    const languages = snippets.reduce((acc, snippet) => {
      if (!acc.includes(snippet.language)) {
        acc.push(snippet.language);
      }
      return acc;
    }, []);

    // Populate language list in sidebar
    languages.forEach((language) => {
      const li = document.createElement('li');
      li.textContent = language;
      li.addEventListener('click', () => {
        filterSnippetsByLanguage(language);
      });
      languageList.appendChild(li);
    });
  });
}

function filterSnippetsByLanguage(language) {
  const filteredSnippets = snippets.filter(snippet => snippet.language === language);
  displaySnippets(filteredSnippets);
}

function loadSnippets() {
  chrome.storage.sync.get('snippets', (data) => {
    snippets = data.snippets || [];
    displaySnippets(snippets);
  });
}

function displaySnippets(snippets) {
  const snippetList = document.getElementById('snippetList');
  snippetList.innerHTML = ''; // Clear previous content

  snippets.forEach((snippet, index) => {
    const snippetItem = document.createElement('div');
    snippetItem.classList.add('snippet-item');
    snippetItem.innerHTML = `
      <strong>${snippet.title}</strong> (${snippet.language})
      <button class="delete-btn" data-index="${index}">Delete</button>
    `;
    snippetList.appendChild(snippetItem);

    // Add event listener for snippet item
    snippetItem.addEventListener('click', () => {
      showSnippetDetails(snippet);
    });

    // Add event listener for delete button
    snippetItem.querySelector('.delete-btn').addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent triggering snippet details click
      deleteSnippet(index);
    });
  });
}

function deleteSnippet(index) {
  snippets.splice(index, 1);
  chrome.storage.sync.set({ snippets }, () => {
    alert('Snippet deleted successfully!');
    displaySnippets(snippets); // Refresh snippet list after deletion
  });
}

function showSnippetDetails(snippet) {
  document.getElementById('snippetTitle').value = snippet.title || '';
  document.getElementById('snippetLanguage').value = snippet.language || '';
  document.getElementById('snippetTags').value = Array.isArray(snippet.tags) ? snippet.tags.join(', ') : '';
  editor.setValue(snippet.code || '');
}

function clearInputs() {
  document.getElementById('snippetTitle').value = '';
  document.getElementById('snippetLanguage').value = '';
  document.getElementById('snippetTags').value = '';
  editor.setValue('');
}

function clearEditor() {
  clearInputs();
}

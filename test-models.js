const fs = require('fs');

const apiKey = "AIzaSyBWwvZoyGXWvxWRJP0LGnqbbq9siWWV4Nk";

async function checkModels() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    const modelNames = data.models?.map(m => m.name).join('\n');
    fs.writeFileSync('out-models.txt', modelNames);
    console.log("Done");
  } catch (err) {
    console.error(err);
  }
}

checkModels();

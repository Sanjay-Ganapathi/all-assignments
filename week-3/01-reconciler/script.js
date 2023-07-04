var parentElement = document.getElementById("mainArea");
function createDomElements(data) {
  // Get the current children of the parent element and convert it to an array

  var currentChildrenObj = {};
  for (const child of parentElement.children) {
    currentChildrenObj[child.dataset.id] = child;
  }

  var fragmentElement = document.createDocumentFragment();
  // Process each item in the data array
  data.forEach(function (item) {
    // Check if a child with this ID already exists

    var existingChild = currentChildrenObj[item.id];

    if (existingChild) {
      // If it exists, update it

      existingChild.children[0].innerHTML = item.title;
      existingChild.children[1].innerHTML = item.description;
      // Remove it from the currentChildren array

      delete currentChildrenObj[item.id];
    } else {
      // If it doesn't exist, create it

      var childElement = document.createElement("div");
      childElement.dataset.id = item.id; // Store the ID on the element for future lookups

      var grandChildElement1 = document.createElement("span");
      grandChildElement1.innerHTML = item.title;

      var grandChildElement2 = document.createElement("span");
      grandChildElement2.innerHTML = item.description;

      var grandChildElement3 = document.createElement("button");
      grandChildElement3.innerHTML = "Delete";
      grandChildElement3.setAttribute("onclick", "deleteTodo(" + item.id + ")");

      childElement.appendChild(grandChildElement1);
      childElement.appendChild(grandChildElement2);
      childElement.appendChild(grandChildElement3);
      fragmentElement.appendChild(childElement);
    }
  });

  parentElement.appendChild(fragmentElement);
  // Any children left in the currentChildren array no longer exist in the data, so remove them
  for (let key in currentChildrenObj) {
    parentElement.removeChild(currentChildrenObj[key]);
  }
}

//
// window.setInterval(() => {
//   let todos = [];
//   for (let i = 0; i<Math.floor(Math.random() * 100); i++) {
//     todos.push({
//       title: "Go to gym",
//       description: "Go to gym form 5",
//       id: i+1
//     })
//   }
//
//   createDomElements(todos)
// }, 1000)

function timeTest(n) {
  let todos = [];
  for (let i = 0; i < n; i++) {
    todos.push({
      title: "Go to gym",
      description: "Go to gym form 5",
      id: i + 1,
    });
  }

  let to = performance.now();

  createDomElements(todos);
  let t1 = performance.now();
  console.log(`Time taken to create/update ${n} elements is ${t1 - to}`);
}

timeTest(10);
timeTest(100);
timeTest(10000);
timeTest(100000);

// Optimisations
// 1.Got the parent element outside the function : Not so significant improvement in the performance
// 2.Replaced the children array with an object : Somewhat performance is improved say about 20 to 30%
// 3.Used document.createFragmentDocument to store the children object and atlast appending it to parent container : 10% improvement

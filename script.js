// Function to parse .ged file
function parseGEDCOM(input) {
    let root = null;
    const individuals = {};
    let currentIndividual = null;
    let father = null;
    let mother = null;
    let lines = input.split('\n');
    lines.forEach(line => {
        const parts = line.trim().split(' ');
        const level = parseInt(parts[0], 10);
        const tag = parts[1];
        const value = parts.slice(2).join(' ');

        if (level === 0 && tag.startsWith('@I')) {
            if (currentIndividual) {
                individuals[currentIndividual.id] = currentIndividual;
            } else {
                root = tag;
            }
            currentIndividual = { id: tag};
        } else if (tag === 'GIVN') {
            currentIndividual[tag] = value;
        } else if (tag === 'SURN') {
            currentIndividual[tag] = value;
        } else if (value === 'FAM') {
            father = null;
            mother = null;
        }else if (level === 1 && tag === 'HUSB') {
            father = value;
        } else if (level === 1 && tag === 'WIFE') {
            mother = value;
        } else if (level === 1 && tag === 'CHIL') {
            if (value in individuals) {
                if (father) {
                    individuals[value]['father'] = father;
                }
                if (mother) {
                    individuals[value]['mother'] = mother;
                }
                //individuals[value]['father'] = father;
                //individuals[value]['mother'] = mother;
            }

        }
    });

    if (currentIndividual) {
        individuals[currentIndividual.id] = currentIndividual;
    }
    return [individuals, root];
}

function buildTree(root, individuals, n_generations){
    let tree = {};
    if (n_generations == 0){
        return null;
    } else if (root in individuals){
        let name = '';
        let surname = '';
        if ('GIVN' in individuals[root]){
            name = individuals[root]['GIVN'];
        }
        if ('SURN' in individuals[root]){
            surname = individuals[root]['SURN']; 
        }
        
        tree['name'] = [name,surname].filter(Boolean).join(' ');
        if ('mother' in individuals[root]){
            let mother = buildTree(individuals[root]['mother'], individuals, n_generations-1);
            if (mother){
                tree['mother'] = mother;
            }
        }
        if ('father' in individuals[root]){
            let father = buildTree(individuals[root]['father'], individuals, n_generations-1); 
            if (father){
                tree['father'] = father;
            }
        }
    }
    return tree;
}

// Get the canvas element from the DOM
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
var select = document.getElementById("selectRoot");

// Set the canvas dimensions
let w = 810;
let h = 810;
canvas.width = w;
canvas.height = h;
let colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink", "brown", "violet", "cyan"];

let n_generations = 8; // TO-DO: get the number of generations from the user
n_generations = n_generations+1;
let radius = (h-10)/2; // 800/2 = 400

function drawGrid(){
    for (let i = 0; i < n_generations; i++){
        for (let j = 0; j < 2**i; j++){
            let start_angle = j/(2**i)*2+0.5;
            let end_angle = (j+1)/(2**i)*2+0.5;
            ctx.beginPath();
            ctx.arc(w/2, h/2, radius/n_generations*i, Math.PI*start_angle, Math.PI*end_angle);
            ctx.arc(w/2, h/2, radius/n_generations*(i+1), Math.PI*end_angle, Math.PI*start_angle, true);
            ctx.stroke();
        }
    }
}

function drawSegment(root, i, j){
    let start_angle = j/(2**i)*2+0.5;
    let end_angle = (j+1)/(2**i)*2+0.5;
    ctx.beginPath();
    ctx.arc(w/2, h/2, radius/n_generations*i, Math.PI*start_angle, Math.PI*end_angle);
    ctx.arc(w/2, h/2, radius/n_generations*(i+1), Math.PI*end_angle, Math.PI*start_angle, true);
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.stroke();
    root['start_angle'] = start_angle;
    root['i'] = i;
    root['j'] = j;
    //ctx.font = "20px Arial";
    //ctx.fillText(root['name'], w/2, h/2);
    if ('father' in root){
        drawSegment(root['father'], i+1, j*2);
    }
    if ('mother' in root){
        drawSegment(root['mother'], i+1, j*2+1);
    }
}
function main(data){
    // reset the canvas and the dropdown menu
    ctx.clearRect(0, 0, w, h);
    drawGrid();
    select.length = 0;
    // parse the .ged file
    let [indis_, root] = parseGEDCOM(data); 
    indis = indis_;
    console.log(root);
    
    // TO-DO: select the root of the tree, currently first individual in ged file
    // build the tree (a dictionary) from the root
    let tree = buildTree(root, indis, n_generations); 
    // draw and fill the root circle
    ctx.beginPath();
    ctx.arc(w/2, h/2, radius/n_generations, 0, Math.PI*2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.stroke();
    // fill in the segments
    if ('father' in tree){
        drawSegment(tree['father'], 1, 0);
    }
    if ('mother' in tree){
        drawSegment(tree['mother'], 1, 1);
    }
    console.log(tree);
    
    let indiList = [];    
    for (const [key, value] of Object.entries(indis)) {
        let user = {};
        user.id = key;
        let name = '';
        let surname = '';
        if ('GIVN' in indis[key]){
            name = indis[key]['GIVN'];
        }
        user.name = name;
        if ('SURN' in indis[key]){
            surname = indis[key]['SURN']; 
        }
        user.surname = surname;
        indiList.push(user);
        fullName = [name,surname].filter(Boolean).join(' ');
        user.fullName = fullName;
    }
    indiList.sort((a, b) => {
        if (a.surname < b.surname) return -1;
        if (a.surname > b.surname) return 1;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });
    console.log(indiList);
    for (let i = 0; i < indiList.length; i++){
        var el = document.createElement("option");
        el.textContent = indiList[i].fullName;
        el.value = indiList[i].id;
        select.appendChild(el);
    }
    
    select.value = root;
}
var indis;
function rootChange(){ 
    
    // reset the canvas and the dropdown menu
    ctx.clearRect(0, 0, w, h);
    drawGrid();
    
    var root = select.value;
    let tree = buildTree(root, indis, n_generations); 
    console.log(tree);
    
    // draw and fill the root circle
    ctx.beginPath();
    ctx.arc(w/2, h/2, radius/n_generations, 0, Math.PI*2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.stroke();
    // fill in the segments
    if ('father' in tree){
        drawSegment(tree['father'], 1, 0);
    }
    if ('mother' in tree){
        drawSegment(tree['mother'], 1, 1);
    }
    console.log(tree);
    
}

const fileSelector = document.getElementById('file-selector');
fileSelector.addEventListener('change', (event) => {
  const fileList = event.target.files;
  fileList[0].text().then(data => {
    main(data);
    });
});

// for testing
fetch('test.ged')
.then(response => response.text())
.then(data => {
    main(data);    
});


window.addEventListener("load", function(){

    document.getElementById("1").addEventListener("click", function(){
        initGame("1");
        document.getElementById("menu").classList.add("hide");
    });
    document.getElementById("2").addEventListener("click", function(){
        initGame("2");
        document.getElementById("menu").classList.add("hide");
    });
    document.getElementById("3").addEventListener("click", function(){
        initGame("3");
        document.getElementById("menu").classList.add("hide");
    });
    document.getElementById("4").addEventListener("click", function(){
        initGame("4");
        document.getElementById("menu").classList.add("hide");
    });

});

function initGame(url){

    // AJAX 
    let req = new XMLHttpRequest();
    req.open("GET", "data/" + url + ".json");
    req.onerror = function() {
        console.log("Échec de chargement "+url);
    };
    req.onload = function() {
        
        if (req.status === 200) {
            let data = JSON.parse(req.responseText);

            // definition de la taille d'une case pour l'affichage
            let size;
            let widthSize = Math.floor(window.innerWidth *0.9)/(data.dimensions[1] + (data.border? 2:0));
            let heightSize = Math.floor(window.innerHeight * 0.95)/(data.dimensions[0] + (data.border? 2:0));

            if( widthSize > heightSize){
                size = heightSize;
            } else {
                size = widthSize;
            }

            // objet contenant les valeur importante
            let value = {
                HEIGHT : data.dimensions[0]+ (data.border? 2:0),
                WIDTH: data.dimensions[1]+ (data.border? 2:0),

                delay : data.delay,
                acceleration : data.acceleration,
                boost : false,
                
                snake : [[1,10]],
                direction : [],

                fruit : data.fruit.place,
                stomach : 3,

                map : undefined,
                caseSize : Math.floor(size),

                score : 0,

                const : {
                    VOID : "#FFF6F2",
                    SNAKE : "green",
                    WALL : "#403E3D",
                    FRUIT : ["#FFAD03", "#FF610B", "#FF0513"],
                    direction : {
                        UP : 0,
                        RIGHT : 1,
                        DOWN : 2,
                        LEFT : 3
                    }
                }
            };
            let score = document.getElementById("score");
        
            // generation du tableau representant le monde
            value.map = new Array();
            for (i=0 ; i<value.HEIGHT ; i++) {
                value.map[i]=new Array();
                for (j=0;j<value.WIDTH;j++) {
                    if((i===0 || j===0 || j===(value.WIDTH-1) || i===(value.HEIGHT-1)) && data.border){
                        value.map[i][j]=value.const.WALL;
                    } else {
                        value.map[i][j]=value.const.VOID;
                    }
                }
            }

            // recuperation des murs
            for(i=0 ; i<data.walls.length ; i++){
                value.map[data.walls[i][0]][data.walls[i][1]] = value.const.WALL;
            }

            document.getElementById("jeu").classList.remove("hide");

            // canvas a la bonne taille
            let canv = document.getElementById("canvas");
            canv.setAttribute("width", value.WIDTH*value.caseSize);
            canv.setAttribute("height", value.HEIGHT*value.caseSize);

            value.direction.push(value.const.direction.RIGHT);
            let direc;

            // enventlistener sur les changement de direction (fleche directionnelle)
            let dir = function (event) {
                let lastDir = (value.direction.length !== 0 ? value.direction[value.direction.length-1] : direc);
                switch (event.key) {
                    case "ArrowDown":
                        if(lastDir !== value.const.direction.UP && lastDir !== value.const.direction.DOWN){value.direction.push(value.const.direction.DOWN);}
                        break;
                    case "ArrowUp":
                        if(lastDir !== value.const.direction.UP && lastDir !== value.const.direction.DOWN){value.direction.push(value.const.direction.UP);}
                        break;
                    case "ArrowLeft":
                        if(lastDir !== value.const.direction.RIGHT && lastDir !== value.const.direction.LEFT){value.direction.push(value.const.direction.LEFT);}
                        break;
                    case "ArrowRight":
                        if(lastDir !== value.const.direction.RIGHT && lastDir !== value.const.direction.LEFT){value.direction.push(value.const.direction.RIGHT);}
                        break;
                    default:
                        return; 
                }
            };
            window.addEventListener("keydown", dir);

            // enventlistener sur les changement de direction (ecran tactile)
            let dri = function (event) {
                let lastDir = (value.direction.length !== 0 ? value.direction[value.direction.length-1] : direc);
                let touchX = event.touches[0].clientX;
                let touchY = event.touches[0].clientY;

                if (touchY < window.innerHeight/4){
                    if(lastDir !== value.const.direction.UP && lastDir !== value.const.direction.DOWN){value.direction.push(value.const.direction.UP);}

                } else if (touchY > 3*window.innerHeight/4){
                    if(lastDir !== value.const.direction.UP && lastDir !== value.const.direction.DOWN){value.direction.push(value.const.direction.DOWN);}

                } else if (touchX < window.innerWidth/3){
                        if(lastDir !== value.const.direction.RIGHT && lastDir !== value.const.direction.LEFT){value.direction.push(value.const.direction.LEFT);}

                } else if (touchX > 2*window.innerWidth/3){
                    if(lastDir !== value.const.direction.RIGHT && lastDir !== value.const.direction.LEFT){value.direction.push(value.const.direction.RIGHT);}
                }
            };
            window.addEventListener("touchstart", dri);

            // affichage de la map
            for (i=0 ; i<value.HEIGHT ; i++) {
                for (j=0 ; j<value.WIDTH ; j++) {
                    setColor(i,j,value.map[i][j],value);
                }
            }

            // affichage du serpent
            for(i=0 ; i<value.snake.length ; i++){
                setColor(value.snake[i][0],value.snake[i][1],value.const.SNAKE, value);
            }

            // affichage des fruits
            for (i=0 ; i<value.fruit.length ; i++){
                setColor(value.fruit[i][0], value.fruit[i][1], value.const.FRUIT[value.fruit[i][2]-1], value);
            }

            // gestion de la vitesse du jeu
            let start = function(speed){
                if (value.boost){
                    return window.setInterval(()=>{gameCore()}, speed/10);
                } 
                return window.setInterval(()=>{gameCore()}, speed);                
            }

            // start game
            let interv = start(value.delay);

            // acceleration si Ctrl enfoncé
            let ctrlDown = function(event){
                if(event.key === "Control"){
                    clearInterval(interv);
                    value.boost = true;
                    interv = start(value.delay);
                }
            };
            let ctrlUp = function(event){
                if(event.key === "Control"){
                    clearInterval(interv);
                    value.boost = false;
                    interv = start(value.delay);
                }
            }
            window.addEventListener("keydown", ctrlDown);
            window.addEventListener("keyup", ctrlUp);

            // acceleration si milieu d'écran pressé
            let centerDown = function(event){
                let touchX = event.touches[0].clientX;
                let touchY = event.touches[0].clientY;

                if(touchY > window.innerHeight/4 && touchY < 3*window.innerHeight/4
                && touchX > window.innerWidth/3 && touchX < 2*window.innerWidth/3){
                    clearInterval(interv);
                    value.boost = true;
                    interv = start(value.delay);
                }
            }
            let centerUp = function(event){
                let touchX = event.changedTouches[0].clientX;
                let touchY = event.changedTouches[0].clientY;

                if(touchY > window.innerHeight/4 && touchY < 3*window.innerHeight/4
                && touchX > window.innerWidth/3 && touchX < 2*window.innerWidth/3){
                    clearInterval(interv);
                    value.boost = false;
                    interv = start(value.delay);
                }
            }
            window.addEventListener("touchstart", centerDown);
            window.addEventListener("touchend", centerUp);

            // fonction centrale du jeu
            function gameCore(){
                
                direc = (value.direction.length !== 0 ? value.direction.shift() : direc);

                // case suivante ou teleportation si bord
                var next = value.snake[value.snake.length-1].slice(0);
                switch(direc){
                    case value.const.direction.UP:
                        next[0]-=1;
                        if(next[0] < 0){next[0] = value.HEIGHT-1;}
                        break;
                    case value.const.direction.RIGHT:
                        next[1]+=1;
                        if(next[1] > value.WIDTH-1){next[1] = 0;}
                        break;
                    case value.const.direction.DOWN:
                        next[0]+=1;
                        if(next[0] > value.HEIGHT-1){next[0] = 0;}
                        break;
                    case value.const.direction.LEFT:
                        next[1]-=1;
                        if(next[1] < 0){next[1] = value.WIDTH-1;}
                        break;
                    default:
                    break;
                }
                
                // action a realiser sur la case d'arrivee
                switch(value.map[next[0]][next[1]]){

                    // jeu perdu retour au menu 
                    case value.const.SNAKE:
                    case value.const.WALL:
                        clearInterval(interv);
                        alert("Vous avez perdu !\nVotre score est de " + value.score);
                        window.removeEventListener("keydown", ctrlDown);
                        window.removeEventListener("keyup", ctrlUp);
                        window.removeEventListener("keydown", dir);
                        document.getElementById("menu").classList.remove("hide");
                        document.getElementById("jeu").classList.add("hide");
                        break;

                    // case avec un fruit
                    case value.const.FRUIT[2]:
                        score.innerHTML = "Score : " + ++value.score; // gestion du score
                    case value.const.FRUIT[1]:
                        score.innerHTML = "Score : " + ++value.score; // gestion du score
                    case value.const.FRUIT[0]:
                        score.innerHTML = "Score : " + ++value.score; // gestion du score
                        for (i=0 ; i<value.const.FRUIT.length ; i++){
                            if(value.const.FRUIT[i]===value.map[next[0]][next[1]]){value.stomach += i+1;}
                        }
                        value.snake.push(next);
                        setColor(next[0], next[1], value.const.SNAKE, value);

                        // nouveau fruit placé de manière aléatoire
                        let j = 0;
                        for (i=0 ; i<value.fruit.length ; i++){
                            if(value.fruit[i][0] === next[0] && value.fruit[i][1] === next[1]){
                                j = i;
                            }
                        }
                        do {
                            value.fruit[j] = [(Math.floor(Math.random() * (value.HEIGHT-2)) + 1),
                                              (Math.floor(Math.random() * (value.WIDTH-2)) + 1 ),
                                              getFruit(data)];
                        } while (value.map[value.fruit[j][0]][value.fruit[j][1]] != value.const.VOID);
                        setColor(value.fruit[j][0], value.fruit[j][1], value.const.FRUIT[value.fruit[j][2]], value);

                        // variation de la vitesse du serpent quand il mange un fruit
                        switch(value.acceleration){
                            case "no":
                                break;
                            case "easy":
                                clearInterval(interv);
                                value.delay = (value.delay < data.delay * 0.75? value.delay : value.delay -= 5);
                                interv = start(value.delay);
                                break;
                            case "medium":
                                clearInterval(interv);
                                value.delay = (value.delay < data.delay * 0.5? value.delay : value.delay -= 10);
                                interv = start(value.delay);
                                break;
                            case "hard":
                                clearInterval(interv);
                                value.delay = (value.delay < data.delay * 0.25? value.delay : value.delay -= 15);
                                interv = start(value.delay);
                                break;
                            case "random":
                                clearInterval(interv);
                                value.delay = (Math.random()*1.5 + 0.25) * data.delay;
                                interv = start(value.delay);
                                break;
                            default:
                                break;
                        }

                        break;
                    
                    // normal, case vide
                    case value.const.VOID:
                        if((value.stomach === 0 ? 0 : --value.stomach) === 0){
                            let last = value.snake.shift();
                            setColor(last[0], last[1], value.const.VOID, value);
                        }
                        value.snake.push(next);
                        setColor(next[0], next[1], value.const.SNAKE, value);
                        break;

                    default:
                        break;
                }
            }
        } else {
            console.log("Erreur " + req.status);
        }
    };
    req.send();
}

// fonction d'affichage
function setColor(line, column, stat, value){

    let ctx = document.getElementById("canvas").getContext("2d");
    value.map[line][column] = stat;

    switch(stat){

        // remplissage classique d'une case complete
        case value.const.VOID:
        case value.const.WALL:
        case value.const.FRUIT[0]:
        case value.const.FRUIT[1]:
        case value.const.FRUIT[2]:
            ctx.beginPath();
            ctx.fillStyle = stat;
            ctx.fillRect(column*value.caseSize , line*value.caseSize , value.caseSize, value.caseSize);
            break;

        // remplissage partiel d'une case pour séparer les bord du serpent
        case value.const.SNAKE:

            // on affiche la case sur laquelle on rentre en blanc
            ctx.beginPath();
            ctx.fillStyle = value.const.VOID;
            ctx.fillRect(column*value.caseSize , line*value.caseSize , value.caseSize, value.caseSize);

            let epaisseur = 8;              // parametre graphique
            let toFill = (epaisseur-2)/epaisseur;

            // affichage du centre de la case comme "corps" du serpent
            ctx.fillStyle = stat;
            ctx.fillRect((column*value.caseSize)+value.caseSize/epaisseur, (line*value.caseSize)+value.caseSize/epaisseur, value.caseSize*toFill, value.caseSize*(3/4));
            
            // remplissage des trou entre 2 morceaux consecutifs du serpent
            if (value.snake[value.snake.length-2] != undefined){
                switch(line-value.snake[value.snake.length-2][0]){

                    case 0:
                        switch(column-value.snake[value.snake.length-2][1]){

                            case 1: // le serpent va a droite
                                ctx.fillRect((value.snake[value.snake.length-2][1]*value.caseSize)+(epaisseur-1)*value.caseSize/epaisseur, (value.snake[value.snake.length-2][0]*value.caseSize)+ value.caseSize/epaisseur, value.caseSize*toFill, value.caseSize*toFill);
                                break;

                            case -1: // le serpent va a gauche
                                ctx.fillRect((column*value.caseSize)+(epaisseur -1)*value.caseSize/epaisseur, (line*value.caseSize)+ value.caseSize/epaisseur, value.caseSize*toFill, value.caseSize*toFill);
                                break;
                            default:
                                // la ou serai gerer le cas ou le serpent se teleporte d'un bord a l'autre
                                break;
                        }
                        break;

                    case 1: // le serpent va en bas
                        ctx.fillRect((value.snake[value.snake.length-2][1]*value.caseSize)+value.caseSize/epaisseur, (value.snake[value.snake.length-2][0]*value.caseSize)+ (epaisseur -1)*value.caseSize/epaisseur, value.caseSize*toFill, value.caseSize*toFill);
                        break;

                    case -1: // le serpent va en haut
                        ctx.fillRect((column*value.caseSize)+value.caseSize/epaisseur, (line*value.caseSize)+ (epaisseur -1)*value.caseSize/epaisseur, value.caseSize*toFill, value.caseSize*toFill);
                        break;

                    default:
                        // la ou serai gerer le cas ou le serpent se teleporte d'un bord a l'autre
                        break;
                }    
            }
            break;

        default:
            break;
        }
    
}

// choix de la valeur d'un fruit selon proba
function getFruit(data){
    let rand = Math.random();
    if(rand<data.fruit.proba[0]){return 0;}
    if(rand<data.fruit.proba[0]+data.fruit.proba[1]){return 1;}
    return 2;
}
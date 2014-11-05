$(function() {
  var Q = window.Q = Quintus({audioSupported: ['wav']})
                     .include('Input, Sprites, Scenes, Touch, UI, 2D, Audio')
                     .setup()
					 .touch()
					 .enableSound();
					 

  Q.input.keyboardControls();
  //Q.input.mouseControls();
  Q.input.touchControls({ 
            controls:  [ ['left','<' ],[],[],[],['right','>' ] ]
  });
  
  

  Q.Sprite.extend("Paddle", {     // extend Sprite class to create Q.Paddle subclass
    init: function(p) {
      this._super(p, {
        sheet: 'paddle',
        speed: 200,
        x: 0,
      });
      this.p.x = Q.width/2;
      this.p.y = Q.height - this.p.h;
      if(Q.input.keypad.size) {
        this.p.y -= Q.input.keypad.size + this.p.h;
      }
    },

    step: function(dt) {
      if(Q.inputs['left']) { 
        this.p.x -= dt * this.p.speed;
      } else if(Q.inputs['right']) {
        this.p.x += dt * this.p.speed;
      }
      if(this.p.x < 0) { 
        this.p.x = 0;
      } else if(this.p.x > Q.width - this.p.w) { 
        this.p.x = Q.width - this.p.w;
      }
//      this._super(dt);	      // no need for this call anymore
    }
  });

  Q.Sprite.extend("Ball", {
    init: function() {
      this._super({
        sheet: 'ball',
        speed: 200,
        dx: 1,
        dy: -1,
      });
      this.p.y = Q.height / 2 - this.p.h;
      this.p.x = Q.width / 2 + this.p.w / 2;
	  
	  this.on('hit', this, 'collision');  // Listen for hit event and call the collision method
	  
	  this.on('step', function(dt) {      // On every step, call this anonymous function
		  var p = this.p;
		  Q.stage().collide(this);   // tell stage to run collisions on this sprite

		  p.x += p.dx * p.speed * dt;
		  p.y += p.dy * p.speed * dt;

		  if(p.x < 0) { 
			p.x = 0;
			p.dx = 1;
			Q.audio.play('paddlewall.wav');
		  } else if(p.x > Q.width - p.w) { 
			p.dx = -1;
			p.x = Q.width - p.w;
			Q.audio.play('paddlewall.wav');
		  }

		  if(p.y < 0) {  //Hit top bound, add sound here
			p.y = 0;
			p.dy = 1;
			Q.audio.play('paddlewall.wav');
		  } else if(p.y > Q.height) { 
			Q.stage().trigger('removeBall'); //Instead of calling lose game here...call function removeBall
			this.destroy(); //Destroy current ball, function calls for a new ball
			//Q.stageScene('lost');
		  }
	  });
    },
	
	collision: function(col) {                // collision method
		if (col.obj.isA("Paddle")) {
//			alert("collision with paddle");
			this.p.dy = -1;
			Q.audio.play('paddleball.wav');
		} else if (col.obj.isA("Block")) {
//			alert("collision with block");
			col.obj.destroy();
			this.p.dy *= -1;
			Q.stage().trigger('removeBlock');
			Q.audio.play('paddleblock.wav');
		}
	}
  });
//test
  Q.Sprite.extend("Block", {
    init: function(props) {
      this._super(_(props).extend({ sheet: 'block'}));
      this.on('collision',function(ball) { 
        this.destroy();
        ball.p.dy *= -1;
        Q.stage().trigger('removeBlock');
      });
    }
  });
  
  //Score for game scene
	Q.UI.Text.extend("Score",{
        init: function(p){
            this._super({
                label: "score: " + Q.state.get("score"),
                x: 65,
                y: 20,
                size: 18,
                family: "Tahoma",
                color: "white"
            });

            Q.state.on("change.score",this,"score");
        },

        score: function(score){
            this.p.label = "score: " + score;
        }
    });
	
	//Lives for game scene
	Q.UI.Text.extend("Lives",{
        init: function(p){
            this._super({
                label: "lives: " + Q.state.get("lives"),
                x: 270,
                y: 20,
                size: 18,
                family: "Tahoma",
                color: "white"
            });

            Q.state.on("change.lives",this,"lives");
        },

        lives: function(lives){
            this.p.label = "lives: " + lives;
        }
    });
  
  
	//Main Title scene
	Q.scene('title', function(stage) {
        var container = stage.insert(new Q.UI.Container({
            fill: "gray",
            border: 5,
            shadow: 10,
            shadowColor: "rgba(0,0,0,0.5)",
            y: 50,
            x: Q.width/2
        }));

        var title = stage.insert(new Q.UI.Text({
            label: "Blockbreak",
            family: "Tahoma",
            color: "rgb(255,255,255)",
            x: 0,
            y: 0
        }), container);

        var button = container.insert(new Q.UI.Button({ x: 0, y: 100, fill: "#CCCCCC",
                                                  label: "Start" }))  
		button.on("click",function() {
			Q.stageScene('game');
		});
		
		var controlsContainer = stage.insert(new Q.UI.Container({
            stroke: "rgb(155,155,155)",
            shadowColor: "rgba(0,0,0,0.5)",
            y: 220
        }), container);

        var controlsText = stage.insert(new Q.UI.Button({
            label: "Controls:",
            font: "800 20px Tahoma",
            fontColor: "white",
            y: 0,
            x: 0
        }), controlsContainer);
		
		var controlsLR = stage.insert(new Q.UI.Button({
            label: "left & right arrow keys",
            font: "800 20px Tahoma",
            fontColor: "white",
            y: 50,
            x: 0
        }), controlsContainer);
		
        container.fit(20,20);
    });
	
	//Won scene when user wins the game
	Q.scene('won', function(stage) {
        var container = stage.insert(new Q.UI.Container({
            fill: "gray",
            border: 5,
            shadow: 10,
            shadowColor: "rgba(0,0,0,0.5)",
            y: 70,
            x: Q.width/2
        }));

        var title = stage.insert(new Q.UI.Text({
            label: "You Win!",
            family: "Tahoma",
            color: "rgb(255,255,255)",
            x: 0,
            y: 0
        }), container);

        var button = container.insert(new Q.UI.Button({ x: 0, y: 100, fill: "#CCCCCC",
                                                  label: "Play Again" }))  
		button.on("click",function() {
			Q.stageScene('game');
		});
		
		
        container.fit(20,20);
    });
	
	//Losing Screen when user loses 3 lives
	Q.scene('lost', function(stage) {
        var container = stage.insert(new Q.UI.Container({
            fill: "gray",
            border: 5,
            shadow: 10,
            shadowColor: "rgba(0,0,0,0.5)",
            y: 70,
            x: Q.width/2
        }));

        var title = stage.insert(new Q.UI.Text({
            label: "You Lose...",
            family: "Tahoma",
            color: "rgb(255,255,255)",
            x: 0,
            y: 0
        }), container);

        var button = container.insert(new Q.UI.Button({ x: 0, y: 100, fill: "#CCCCCC",
                                                  label: "Play Again?" }))  
		button.on("click",function() {
			Q.stageScene('game');
		});
		
		
        container.fit(20,20);
    });
	
	//Takes the Score and Lives declared earlier in the code
	Q.scene('hud',function(stage){
		stage.insert(new Q.Score());
		stage.insert(new Q.Lives());
	});
	
	
	Q.scene('game',function(stage) {
	
		Q.state.reset({lives: 3, score: 0});
		
        stage.insert(new Q.Paddle());
        stage.insert(new Q.Ball());
		
		Q.stageScene('hud',2);

        //insert blocks in a 6x5 array formation
        var blockCount=0;
		
		var ballCount = 3;
		
        for(var x=0;x<6;x++) {
            for(var y=0;y<5;y++) {
                stage.insert(new Q.Block({ x: x*50+35, y: y*30+50 })); //Adjusted for the HUD
                blockCount++;
            }
        }
        stage.on('removeBlock',function() {
            blockCount--;
			Q.state.inc("score",100); //Every block gives 100 points
            if(blockCount == 0) {
                //reset game when no blocks remain
                Q.stageScene('won'); //make won later
            }
        });
		
		//Added this function to adjust to how the lives work
		stage.on('removeBall',function() {
			ballCount--;
			Q.state.dec("lives",1);
			if(Q.state.get("lives") <=0){
				Q.stageScene('lost');
			}else if(ballCount == 2){		//ballCount goes with lives
				stage.insert(new Q.Ball());
			}else if(ballCount == 1){
				stage.insert(new Q.Ball());
			}else if(ballCount == 0){
				stage.insert(new Q.Ball());
			}
		});
				
    });

//  Q.load(['blockbreak.png','blockbreak.json'], function() {
  Q.load(['blockbreak.png','paddleball.wav','paddleblock.wav','paddlewall.wav'], function() {
    // Q.compileSheets('blockbreak.png','blockbreak.json');  
	Q.sheet("ball", "blockbreak.png", { tilew: 20, tileh: 20, sy: 0, sx: 0 });
	Q.sheet("block", "blockbreak.png", { tilew: 40, tileh: 20, sy: 20, sx: 0 });
	Q.sheet("paddle", "blockbreak.png", { tilew: 60, tileh: 20, sy: 40, sx: 0 });
	Q.stageScene('title');
    //Q.stageScene('game');
  });  
});
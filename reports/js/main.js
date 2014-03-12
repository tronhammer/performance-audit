window.oppa = {
	"fixtures": {
		"progressions": {
			"5%": 30,
			"15%": 100,
			"35%": 450,
			"40%": 700,
			"45%": 900,
			"50%": 1000,
			"68%": 1080,
			"78%": 1120,
			"99%": 1300,
			"100%": 1500
		},
		"progress": function()
		{
			for (prog in window.oppa.fixtures.progressions)
			{
				$(".progress-bar").each(function()
				{
					oprand = Math.floor(Math.random() * 2),
						timerand = Math.floor(Math.random() * 100) * (oprand % 2 ? 1 : -1),
						time = window.oppa.fixtures.progressions[prog] + timerand;
			
					setTimeout(function($progBar, prog, time){
						$progBar.css("width", prog);
						if (prog=="100%")
						{
							setTimeout(function($progBar){
								$progBar.parent().fadeOut();
							}, 150, $progBar);
						}
					}, time, $(this), prog, time);
				});
			}
		}
	},
	
	"dashboards": {},
	"_dashboards": {
		"raw-stats": {},
		"graphs": {},
		"recommendations": {},
		"more-info": {}
	},
	
	"widgets": {},
	"_widgets": {
		"more-info": {},
		"raw-stats": {
			"stats": [],
			"init": function()
			{
				this.progressLoader(0);
				
				this.stats = this.generateStats();
				
				this.progressLoader(15);
				
				return this.render();
			},
			
			"render": function()
			{
				var _this = this;
				var $list = this.target.find(".list-group");
				
				$list.children().remove();
				
				this.progressLoader(50);
				
				
				this.stats.map(function(stat){
					$list.append( 
						$("<li class=\"list-group-item\">")
							.text( stat.name )
							.append( $("<span class=\"badge\">").text( stat.stat ) )
							.hide().fadeIn().css("display","block")
					);
				});
				
				this.progressLoader(100);
				
				return true;
			},
			
			"generateStats": function()
			{
				var results = [];
				var data = oppa.data;
				
				if (data && data.realms && data.realms.frontend)
				{
					if (data.realms.frontend.BoomerangPerformanceAuditor)
					{
						var boomerangAuditorMetrics = data.realms.frontend.BoomerangPerformanceAuditor;
						var boomerang = {
							"total": 0,
							"count": 0,
						};
						
						for(var i=0;i<boomerangAuditorMetrics.length;i++)
						{
							var metrics = boomerangAuditorMetrics[i];
							var data = JSON.parse(metrics.data);
							boomerang.total += data.paneLoad;
							boomerang.count++;
						}
				
						results.push({
							"name": "Average wait until Paneload event is fired. ",
							"stat": ((boomerang.total / boomerang.count) / 100 / 60).toFixed(5)
						});
					}
				}
				
				return results;
			}
		},
		"graph-realms": {},
		"graph-yslow": {},
		"graph-browsercache": {}
	},
	
	"components": {
		
		"Dashboard": (function()
		{
			var Dashboard = function(config)
			{
				this.initialized = true;
				
				this.widgets = {};
				
				for(var propName in config)
				{
					this[propName] = config[propName];
				}
				console.log("Creating dashboard \""+ this.name +"\"!");
				
				this.init && this.init();
			}

			Dashboard.prototype.progressLoader = function(percentage)
			{
				var _this = this;
				if (!this.progressBar)
				{
					this.progressBar = this.target.find("[data-comp-type='progress-bar']").filter("[data-comp-dashboard='"+ this.name +"']");
				}
				
				if (+percentage)
				{
					percentage = percentage+"%";
				}
				
				if (percentage == "100%")
				{
					this.progressBarDone = true;
					setTimeout(function(){
						_this.progressBar.fadeOut();
					}, 250);
				}
				else if (this.progressBarDone)
				{
					this.progressBarDone = false;
					this.progressBar.children().first().css("width", "%1").hide();
					this.progressBar.fadeIn();
				}
				
				this.progressBar.children().first().show().css("width", percentage);
			};

			return Dashboard;
		})(),
		"Widget": (function()
		{
			var Widget = function(config)
			{
				this.initialized = true;
				
				for(var propName in config)
				{
					this[propName] = config[propName];
				}
				console.log("Creating widget \""+ this.name +"\"!");
				
				this.init && this.init();
			}

			Widget.prototype.progressLoader = function(percentage)
			{
				var _this = this;
				if (!this.progressBar)
				{
					this.progressBar = this.target.find("[data-comp-type='progress-bar']").filter("[data-comp-widget='"+ this.name +"']");
				}
				
				if (+percentage)
				{
					percentage = percentage+"%";
				}
				
				if (percentage == "100%")
				{
					this.progressBarDone = true;
					setTimeout(function(){
						_this.progressBar.fadeOut();
					}, 250);
				}
				else if (this.progressBarDone)
				{
					this.progressBarDone = false;
					this.progressBar.children().first().css("width", "%1").hide();
					this.progressBar.fadeIn();
				}
				
				this.progressBar.children().first().show().css("width", percentage);
			};

			return Widget;
		})()
	},
	"init": function(data)
	{
		var _this = window.oppa;
		var $compElements = $("[data-comp-name]");
		
		this.data = data;
		
		this.fixtures.progress();
		
		$compElements.filter("[data-comp-type='dashboard']").each(function()
		{ 
			var data = $(this).data();
			
			if (_this.dashboards[ data["compName"] ])
			{
				_this.dashboards[ data["compName"] ].init && _this.dashboards[ data["compName"] ].init();
			}
			else
			{
				var definition = _this._dashboards[ data["compName"] ];
			
				definition["name"] = data["compName"];
				definition["target"] = $(this)
				definition["data"] = data
				
				_this.dashboards[ data["compName"] ] = new _this.components.Dashboard(definition);
			}
		});
		
		$compElements.filter("[data-comp-type='widget']").each(function()
		{ 
			var data = $(this).data();
			
			if (_this.widgets[ data["compName"] ])
			{
				_this.widgets[ data["compName"] ].init && _this.widgets[ data["compName"] ].init();
			}
			else
			{
				var definition = _this._widgets[ data["compName"] ];
				
				definition["dashboard"] = data["compDashboard"];
				definition["name"] = data["compName"];
				definition["target"] = $(this)
				definition["data"] = data
			
				_this.dashboards[ data["compDashboard"] ].widgets[ data["compName"] ] = _this.widgets[ data["compName"] ] = new _this.components.Widget(definition);
			}
		});
	}
};


$(function()
{
	$(".oppa-results-set-container").children().fadeOut();
	
	$("body").delegate("#oppa-search-submit", "click", function(){
		var from = $("#oppa-search-from").val() || "2 weeks ago",
			to = $("#oppa-search-to").val() || "yesterday";
		
			/**
			 * @todo Change common time terms
			 *     "morning"=>"9:00:00"
			 *     "afternoon"=>"12:00:00"
			 *     "evening"=>"17:00:00"
			 *     "dusk"=>"19:00:00"
			 */
		
		$.ajax({
			"url": "../api/", 
			"data": { 
				"source": $("#oppa-search-source").val(),
				"realm": $("#oppa-search-realm").val(),
				"from": from,
				"to": to
			}
		}).success(function(resp)
		{
			if (resp)
			{
				var data = JSON.parse(resp);
				
				$(".oppa-results-set-container").removeClass("hide").children().fadeIn();
				
				window.oppa.init(data.data); 
			}
		})
	});
});
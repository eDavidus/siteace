// create new Websites collection
Websites = new Mongo.Collection("websites");

// create new comments collection
Comments = new Mongo.Collection("collections");

// create index for easy search function
WebsitesIndex = new EasySearch.Index({
	collection: Websites,
	fields: ['title', 'description'],
	engine: new EasySearch.Minimongo()
});

// HTTP.get('http://www.fnac.com', {}, function( error, response ) {
//   if ( error ) {
//     console.log( error );
//   } else {
//     console.log( response );
//     console.log($(response.content).closest('title'));
//     /*
//      This will return the HTTP response object that looks something like this:
//      {
//       content: "String of content...",
//       data: Array[100], <-- Our actual data lives here. 
//       headers: {  Object containing HTTP response headers }
//       statusCode: 200
//      }
//     */
//   }
// });

if (Meteor.isClient) {

	// Add username in create user form
	Accounts.ui.config({
	  passwordSignupFields: "USERNAME_AND_EMAIL"
	});

	// router configuration of super template
	Router.configure({
	  layoutTemplate: 'ApplicationLayout'
	});

	// routing to root level
	Router.route('/', function () {
		this.render('navbar', {
			to: "navbar"
		});
	    this.render('website_list', {
	      to: "main"
	    });
	  });
	  
	  
	Router.route('/:_id', function () {
		this.render('navbar', {
			to: "navbar"
		});
		this.render('website_detail', {
			to: "main",
			data: function () {
				return Websites.findOne({_id: this.params._id});
			}
		});
	});

	/////
	// template helpers 
	/////

	// helper function that returns all available websites
	Template.website_list.helpers({
		websites:function(){
			return Websites.find({}, 
			{sort:{vote_up: -1}});
		}
	});

	Template.website_detail.helpers({
		comments: function () {
			return Comments.find({website_id: this._id});
			// if (Session.get("websiteId")) {
			// 	console.log(Session.get("websiteId"));
			// 	return Comments.find({website_id: Session.get("websiteId")});	
			// }
		},
		
	});
	
	Template.comment_item.helpers({
		// trmplate function to return username with userid
		getUser: function (user_id) {
			var user = Meteor.users.findOne({_id: user_id});
			if (user) {
				//return "anon1";
				return user.username;
			}
			else {
				return "anon";
			}
		}	
	});

	Template.search.helpers({
	  inputAttributes: function () {
	      return { 'class': 'easy-search-input','placeholder': 'Start searching...' };
	    },
	  websitesIndex: () => WebsitesIndex // instanceof EasySearch.Index
	});

	/////
	// template events 
	/////

	Template.website_item.events({
		"click .js-upvote":function(event){
			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
			var website_id = this._id;
			var vote_up = this.vote_up + 1;
			console.log("Up voting website with id "+website_id);
			// to add a vote to a website!
			Websites.update({_id: website_id},
							{$set: {vote_up: vote_up}}
							);

			return false;// prevent the button from reloading the page
		}, 
		"click .js-downvote":function(event){

			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
			var website_id = this._id;
			var vote_down = this.vote_down - 1;
			console.log("Down voting website with id "+website_id+" vote "+vote_down);
			//  code in here to remove a vote from a website!
			Websites.update({_id: website_id},
							{$set: {vote_down: vote_down}}
							);



			return false;// prevent the button from reloading the page
		},
		// for test only
		'click .js-set-http': function () {

			HTTP.get('www.fnac.com', {}, function( error, response ) {
			  if ( error ) {
			    console.log( error );
			  } else {
			    console.log( response );
			    console.log($(response).closest('title'));
			  }
			});

		}
	})

	// to active form to add a new website
	Template.website_form.events({
		"click .js-toggle-website-form":function(event){
			$("#website_form").toggle('slow');
		}, 
		"submit .js-save-website-form":function(event){
			
			// here is an example of how to get the url out of the form:
			var url = event.target.url.value;
			var title = event.target.title.value;
			var description = event.target.description.value;
			console.log("Values entered are: "+url+" "+title+" "+description);
			
			// add new entry to Wesites collection
			if (Meteor.user()) {
				Websites.insert({
					title: title,
					url: url,
					description: description,
					createdOn: new Date(),
					createdby: Meteor.user()._id,
					vote_up: 0,
					vote_down: 0
				});
			}

			// clear form's entries
			document.getElementById("comment-form-2").reset();
			// collapse form
			$("#website_form").toggle('slow');
			return false;// stop the form submit from reloading the page

		}
	});
	
	// to active form to add a new comment
	Template.comment_form.events({
		"click .js-toggle-comment-form":function(event){
			$("#comment_form").toggle('slow');
		}, 
		"submit .js-save-comment-form":function(event){

			// add comment to comments collection
			var comment = event.target.comment.value;
			console.log(comment);
			var current_user;
			if (Meteor.user()){
				current_user = Meteor.user()._id;
			}
			else {
				current_user = "anon";
			}
			Comments.insert({
				website_id: this._id, //Session.get("websiteId"),
				comment: comment,
				createdOn: new Date(),
				createdBy: current_user
			});
			
			// clear form's entries
			document.getElementById("comment-form-2").reset();
			// collapse form
			$("#comment_form").toggle('slow');
			//return false;// stop the form submit from reloading the page
			return false;

		}
	});
	
	// search function
	Tracker.autorun(function () {
	  let cursor = WebsitesIndex.search('best'); // search all docs that contain "best" in the name or score field
	
	  console.log(cursor.fetch()); // log found documents with default search limit
	  console.log(cursor.count()); // log count of all found documents
	});
	

} // end if client


if (Meteor.isServer) {
	// start up function that creates entries in the Websites databases.
  Meteor.startup(function () {
    // code to run on server at startup
    if (!Websites.findOne()){
    	console.log("No websites yet. Creating starter data.");
    	  Websites.insert({
    		title:"Goldsmiths Computing Department", 
    		url:"http://www.gold.ac.uk/computing/", 
    		description:"This is where this course was developed.", 
    		createdOn:new Date(),
    		vote_up: 0,
    		vote_down: 0
    	});
    	 Websites.insert({
    		title:"University of London", 
    		url:"http://www.londoninternational.ac.uk/courses/undergraduate/goldsmiths/bsc-creative-computing-bsc-diploma-work-entry-route", 
    		description:"University of London International Programme.", 
    		createdOn:new Date(),
    		vote_up: 0,
    		vote_down: 0
    	});
    	 Websites.insert({
    		title:"Coursera", 
    		url:"http://www.coursera.org", 
    		description:"Universal access to the world’s best education.", 
    		createdOn:new Date(),
    		vote_up: 0,
    		vote_down: 0
    	});
    	Websites.insert({
    		title:"Google", 
    		url:"http://www.google.com", 
    		description:"Popular search engine.", 
    		createdOn:new Date(),
    		vote_up: 0,
    		vote_down: 0
    	});
    }
  });
} // end if server

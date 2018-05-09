var React = require('react')
var ReactDOM = require('react-dom')
var shuffleSeed = require('shuffle-seed')
import { Grid, Row, Col } from 'react-bootstrap'
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { ToggleButton, ButtonToolbar, ToggleButtonGroup, DropdownButton, MenuItem, SplitButton } from 'react-bootstrap';
import { FormGroup, ControlLabel, FormControl, Button, Collapse } from 'react-bootstrap';
import { Media } from 'react-bootstrap';
import { isMobile, isChrome, isSafari, isFirefox } from 'react-device-detect';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Modal } from 'react-bootstrap';

// Buttons for sorting posts by recent or popular
class SortBar extends React.Component {
	constructor(props, context) {
		super(props, context);
		this.state = {
			value: "recent", // recent or popular
			isLoaded : true,
		};
		this.setRecent = this.setRecent.bind(this);
		this.setPopular = this.setPopular.bind(this);
	}
	setRecent() {
		if (this.state.value !== "recent") {
			this.setState({
				value: "recent",
			});
			this.props.toggleSort("recent");
		}
	}
	setPopular() {
		if (this.state.value !== "popular") {
			this.setState({
				value: "popular",
			});
			this.props.toggleSort("popular");
		}
	}
    render() {
		return (
				<div className="sortbar">
					<ButtonToolbar>
					  <ToggleButtonGroup defaultValue={"recent"} type="radio" name="sortbar" >
						<ToggleButton value={"recent"} onClick={this.setRecent} className="sort-button">Recent</ToggleButton>
						<ToggleButton value={"popular"} onClick={this.setPopular} className="sort-button">Popular</ToggleButton>
					  </ToggleButtonGroup>
					</ButtonToolbar>
				</div>
		);
    }
}

function Chevron_up(props) {
	return (
		<span className="glyphicon glyphicon-menu-up"
			aria-hidden="true"
			style={{"color":"black", "cursor": "pointer"}}
			onClick = {props.onClick}>
		</span>
	);
}

function Chevron_up_clicked(props) {
	return (
		<span className="glyphicon glyphicon-menu-up"
			aria-hidden="true"
			style={{"color":"#F19143", "cursor": "pointer"}}
			onClick = {props.onClick}>
		</span>
	);
}

function Chevron_down(props) {
	return (
		<span className="glyphicon glyphicon-menu-down"
			aria-hidden="true"
			style={{"color":"black", "cursor": "pointer"}}
			onClick = {props.onClick}>
		</span>
	)
}

function Chevron_down_clicked(props) {
	return (
		<span className="glyphicon glyphicon-menu-down"
			aria-hidden="true"
			style={{"color":"#F19143", "cursor": "pointer"}}
			onClick = {props.onClick}>
		</span>
	)
}

class Speech_bubble extends React.Component {
 	render() {
 		return (
 				<span className="glyphicon glyphicon-comment" aria-hidden="true" style={{"cursor": "pointer"}}></span>
		);
	}
}

class Share_icon extends React.Component {
 	render() {
 		return (
 				<span className="glyphicon glyphicon-send" aria-hidden="true"></span>
		);
	}
}


function Refresh_icon(props) {
	return (
			<span className="glyphicon glyphicon-refresh" onClick={props.onClick} aria-hidden="true"></span>
	);
}



function timestamp(st) {
		var moment = require('moment');
		var postDatetime = moment(st, moment.ISO_8601);
		var now = moment();
		var timeAgo = now.diff(postDatetime,'seconds');

		if (timeAgo < 60) {
			var timeUnit = "just now";
		}
		else if (timeAgo < 120) {
			timeAgo = 1;
			var timeUnit = "minute ago"
		}

		else if (timeAgo < 3600) {
			timeAgo = now.diff(postDatetime,'minutes');
			var timeUnit = "minutes ago"
		}

		else if (timeAgo < 7200) {
			timeAgo = 1;
			var timeUnit = "hour ago"
		}

		else if (timeAgo < 86400) {
			timeAgo = now.diff(postDatetime,'hours');
			var timeUnit = "hours ago"
		}

		else if (timeAgo < 172800) {
			timeAgo = 1;
			var timeUnit = "day ago"
		}

		else {
			timeAgo = now.diff(postDatetime,'days');
			var timeUnit = "days ago"
		}

		let date_string = `${timeAgo} ${timeUnit}`;
		if (timeUnit == "just now") {
			date_string = `${timeUnit}`;
		}
	return(date_string);
}

// A single comment
class Comment extends React.Component{
	constructor(props) {
		super(props);
		this.handleUpvoteClick = this.handleUpvoteClick.bind(this);
		this.handleUpvoteUnclick = this.handleUpvoteUnclick.bind(this);
		this.handleDownvoteClick = this.handleDownvoteClick.bind(this);
		this.handleDownvoteUnclick = this.handleDownvoteUnclick.bind(this);
		this.handleDelete = this.handleDelete.bind(this);
		this.handleExpand = this.handleExpand.bind(this);
		this.cutoffContent = this.cutoffContent.bind(this);
		this.handleShowReportWindow = this.handleShowReportWindow.bind(this);
		this.handleCloseReportWindow = this.handleCloseReportWindow.bind(this);
		this.state = {
			content: this.props.content,
			upvoted: this.props.upvoted,
			downvoted: this.props.downvoted,
			votes: this.props.votes,
			needsExpansion: (this.props.content.length > 280
							|| this.props.content.split(/\r\n|\r|\n/).length > 3),
			expanded: false, // if the comment needs expansion, is it expanded?
			reported: false,
			deleted: this.props.deleted,
			reportWindow: false,
		};
	}

	componentWillReceiveProps(nextProps) {
		if(this.props.upvoted != nextProps.upvoted) {
			this.setState({
				upvoted: nextProps.upvoted,
				downvoted: nextProps.downvoted,
			});
		}
		if(this.props.deleted != nextProps.deleted) {
			this.setState({
				deleted: nextProps.deleted,
				content: nextProps.content,
			})
		}
	}

	// TODO: think about error handling - i.e. behavior when no server connection
	sendVoteToServer(tag) {
		fetch("/api/comments/"+this.props.id+"/"+tag+"/", {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		})
	}

	// voting logic
	handleUpvoteClick() {
		if (this.state.upvoted) {
			return;
		}
		else if (this.state.downvoted) {
			this.setState({
				upvoted : true,
				downvoted : false,
				votes : this.state.votes + 2,
			})
		}
		else {
			this.setState({
				upvoted : true,
				votes : this.state.votes + 1
			})
		}
		this.sendVoteToServer("u");
	}
	handleUpvoteUnclick() {
		if (!this.state.upvoted) {
			return;
		}
		else {
			this.setState({
				upvoted : false,
				votes : this.state.votes - 1,
			})
		}
		this.sendVoteToServer("c");
	}
	handleDownvoteClick() {
		if (this.state.downvoted) {
			return;
		}
		else if (this.state.upvoted) {
			this.setState({
				downvoted : true,
				upvoted : false,
				votes : this.state.votes - 2,
			})
		}
		else {
			this.setState({
				downvoted : true,
				votes : this.state.votes - 1
			})
		}
		this.sendVoteToServer("d");
	}
	handleDownvoteUnclick() {
		if (!this.state.downvoted) {
			return;
		}
		else {
			this.setState({
				downvoted : false,
				votes : this.state.votes + 1,
			})
		}
		this.sendVoteToServer("c");
	}

	handleDelete() {
		this.props.handleDelete(this.props.id);
		this.setState({
			deleted: true,
			content: "[deleted]",
		})
	}

	handleExpand(e) {
		this.setState({
			expanded : !this.state.expanded,
		})
	}

	// prevent dropdown close when clicking 'report'
	// code from https://github.com/react-bootstrap/react-bootstrap/issues/1490
	dropdownToggle(newValue){
	    if (this._forceOpen){
	        this.setState({ menuOpen: true });
	        this._forceOpen = false;
	    } else {
	        this.setState({ menuOpen: newValue });
	    }
	}
	menuItemClickedThatShouldntCloseDropdown(){
	    this._forceOpen = true;
	    this.handleShowReportWindow();
		fetch("/api/comments/"+this.props.id+"/r/", {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		});

		this.setState({
			reported: true,
		});

		
	}

	// cut off content to 3 lines or 280 chars, whichever is fewer
	cutoffContent(content) {
		let newContent = content;
		if (newContent.split(/\r\n|\r|\n/).length > 3) {
			newContent = newContent.split(/\r\n|\r|\n/).slice(0,3).join('\n');
		}
		return newContent.slice(0,280)
	}
	renderContent() {
		let content = this.state.expanded
							? this.props.content + " "
							: this.cutoffContent(this.props.content) + " "


		return (
				this.state.needsExpansion
				? ( this.state.expanded
					? (<div>{content}<span className="seemore" onClick={this.handleExpand}>see less</span></div>)
					: (<div>{content}<span className="seemore" onClick={this.handleExpand}>...see more</span></div>)
				  )
			    : content
		);
	}
	renderVotes() {
		return(
			<div className="arrowBox">
				{
					this.state.upvoted
					? <Chevron_up_clicked onClick={this.handleUpvoteUnclick}/>
					: <Chevron_up onClick={this.handleUpvoteClick}/>
				}
	    		{this.state.votes}
				{
					this.state.downvoted
					? <Chevron_down_clicked onClick={this.handleDownvoteUnclick}/>
					: <Chevron_down onClick={this.handleDownvoteClick}/>
				}
			</div>
		);
	}
	renderDropdown() {
		return(
			<DropdownButton pullRight
				className="commentDropdown"
				bsSize="small"
				title=""
				id="dropdown-size-small"
				open={this.state.menuOpen}
				onToggle={val => this.dropdownToggle(val)}
			>
				{ this.props.isMine
					? <MenuItem onClick={this.handleDelete}>Delete</MenuItem>
					: (this.state.reported
						? <MenuItem>Reported ✔</MenuItem>
						: <MenuItem onClick={() => this.menuItemClickedThatShouldntCloseDropdown()}>Report</MenuItem>)
				}
			</DropdownButton>
		);
	}
	renderIconline() {
		let date_string = timestamp(this.props.date);
		return(
			<div>
				<Media.Left>
				<div className="iconFirstColumn">
				</div>
				</Media.Left>
				<Media.Body className="commentBody" onClick={this.props.onClick} style={{color:"#696969"}}>
				</Media.Body>
				<Media.Right className="dateString" style={{color:"#696969"}}>
					{date_string}
				</Media.Right>
			</div>
		);
	}

	handleCloseReportWindow() {
    	this.setState({ reportWindow: false });
  	}

  	handleShowReportWindow() {
    	this.setState({ reportWindow: true });
  	}


	render() {
		return (
				<div className="replyContainer">
				<div className="replyBody" style={{borderLeft: "solid 4px", borderLeftColor: this.props.color}}>
				<Media>
				    <Media.Left>
						{!this.state.deleted ? this.renderVotes() : null}
				    </Media.Left>
				    <Media.Body className="wrapTextComment" onClick={this.props.onClick}>
						{!this.state.deleted ? this.renderContent()
										     : (<div className="deletedText">{this.state.content}</div>)}
				   	</Media.Body>
				   	<Media.Right className="dropdown-container">
						{!this.state.deleted ? this.renderDropdown() : null}
				   	</Media.Right>
				   	<Modal show={this.state.reportWindow} onHide={this.handleCloseReportWindow}>
			          <Modal.Header closeButton>
			            <Modal.Title>Reported!</Modal.Title>
			          </Modal.Header>
			          <Modal.Body>
			            <h4>Thanks for reporting. Our team will soon review this comment.</h4>
			          </Modal.Body>
			          <Modal.Footer>
			          	<Button onClick={this.handleCloseReportWindow}>Close</Button>
			          </Modal.Footer>
			        </Modal>
				</Media>
			  	</div>
					<Media className="replyIconLine" style={{borderLeft: "solid 4px", borderLeftColor: this.props.color}}>
						{!this.state.deleted ? this.renderIconline() : null}
					</Media>
			  	</div>
		);
	}
}


// The textarea and reply button underneath every group of comments
class CommentEntryForm extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: '',
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
	}

	handleChange(event) {
		this.setState({value: event.target.value});
	}

	handleSubmit(event) {
		if(event) {
			event.preventDefault();
			event.stopPropagation();
		};
		this.props.onClick(this.state.value)
		this.setState({value:''});
	}

	onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		if (event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			if (this.state.shift) {
				this.setState({
					value:this.state.value+'\n',
				})
			}
			else {
				this.handleSubmit();
			}
		} else if (event.key === 'Shift') {
				this.setState({
					shift: true,
				});
			}
		}
	onKeyUp(event: React.KeyboardEvent<HTMLDivElement>) {
		if (event.key === 'Shift') {
			this.setState({
				shift: false,
			});
		}
	}

	render() {
		return (
			<div className="container-fluid" id="commentContainer">
			<form className="replying" onSubmit={this.handleSubmit} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}>
				  <FormControl componentClass="textarea"
				  			  className="replyBox"
							  name="reply"
							  id="maintext"
							  value={this.state.value}
							  onChange={this.handleChange}
							  cols="109"
							  rows="2"
							  autoComplete="off"
							  maxLength="1000"
							  placeholder="Reply"/>
					<Button
						type="submit"
						id="post"
						>
					Post
					</Button>
			</form>
			</div>
		);
	}
}

// A block of comments and associated entry form
class CommentBlock extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			comments: this.props.comments,
			my_upvoted: this.props.my_upvoted,
			my_downvoted: this.props.my_downvoted,
			my_comments: this.props.my_comments,
		}
		this.silentRefreshComments = this.silentRefreshComments.bind(this);
		this.handleComment = this.handleComment.bind(this);
		this.getUserData = this.getUserData.bind(this);
		this.handleDelete = this.handleDelete.bind(this);
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.props.comments != prevProps.comments) {
			this.setState({
				comments: this.props.comments,
				my_upvoted: this.props.my_upvoted,
				my_downvoted: this.props.my_downvoted,
				my_comments: this.props.my_comments,
			})
		}
	}

	silentRefreshComments() {
		fetch("/api/posts/"+this.props.id+"/comments/", {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		})
		.then(res => res.json())
		.then(
			(result) => {
				this.setState({
					comments: result,
					comment_count: result.length,
				});
			},
		);
	}

	getUserData() {
		fetch("/api/users/"+userid+"/", {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		})
		.then(res => res.json())
		.then(
			(result) => {
				this.setState({
					my_comments: result.comments,
					my_upvoted: result.comments_upvoted,
					my_downvoted: result.comments_downvoted,
				});
			}
		)
	}

	// add a new comment
	handleComment(text) {
		// this.silentRefreshComments();
		if (text.trim() != ''){
			fetch("/api/posts/"+this.props.id+"/comments/", {
					method: 'POST',
					credentials: "same-origin",
					headers : new Headers(),
					headers: {
						 "X-CSRFToken": csrftoken,
						 'Accept': 'application/json',
						 'Content-Type': 'application/json',
					},
					body:JSON.stringify({
						"content":text,
						"post":this.props.id,
					})
				})
			.then(res => res.json())
			.then(
				(result) => {
					result.content = text;
					result.net_votes = 0;
					this.setState({
						comments: this.state.comments.concat([result]),
						my_comments: this.state.my_comments.concat(result.id),
					});
					this.props.handleComment(this.props.id);
				},
				(error) => {
					alert(error);
				}
			)
		}
	}

	// delete a comment by ID
	handleDelete(id) {
		fetch("/api/comments/"+id+"/del/", {
				method: 'GET',
				credentials: "same-origin",
				headers : new Headers(),
				headers: {
					 "X-CSRFToken": csrftoken,
					 'Accept': 'application/json',
					 'Content-Type': 'application/json',
				},
			}
		)
		.then(
			(result) => {
				var newcomments = this.state.comments;
				for (let i = 0; i < newcomments.length; i++) {
					if (newcomments[i].id == id) {
						newcomments[i].content = result.content;
						break;
					}
				}
				this.setState({
					comments : newcomments
				});
			}
		)
	}

	render() {
		return (
			<div className='commentBlock'>
				{ this.state.comments.map((comment) => (
						<Comment
							color={comment.anon_author == 0
										? "#f19143"
										: this.props.color_list[comment.anon_author-1]}
							content={comment.content}
							key={"comment" + comment.id}
							id={comment.id}
							votes={comment.net_votes}
							date={comment.date_created}
							isMine={this.state.my_comments.includes(comment.id)}
							upvoted={this.state.my_upvoted.includes(comment.id)}
							downvoted={this.state.my_downvoted.includes(comment.id)}
							deleted={comment.deleted}
							handleDelete={this.handleDelete}
						/>)
					)
				}
			<CommentEntryForm onClick={this.handleComment}/>
			</div>
		);
	}
}

// The textarea and reply button for creating new posts
class PostEntryForm extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: '',
			shift: false,
		};
		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
	}

	handleChange(event) {
		this.setState({value: event.target.value});
	}

	handleSubmit(event) {
		if(event) {
			event.preventDefault();
			event.stopPropagation();
		};
		this.props.onClick(this.state.value)
		this.setState({value:''});
	}

	onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		if (event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			if (this.state.shift) {
				this.setState({
					value:this.state.value+'\n',
				})
			}
			else {
				this.handleSubmit();
			}
		} else if (event.key === 'Shift') {
				this.setState({
					shift: true,
				});
			}
		}

	onKeyUp(event: React.KeyboardEvent<HTMLDivElement>) {
		if (event.key === 'Shift') {
			this.setState({
				shift: false,
			});
		}
	}

	render() {
		return (
			<div className="container-fluid" id="postContainer">
			<form onSubmit={this.handleSubmit} onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}>
			<div className="post-container">
				  <FormControl componentClass="textarea"
				  			className="posting"
							  name="entry"
							  id="maintext"
							  value={this.state.value}
							  onChange={this.handleChange}
							  cols="109"
							  rows="2"
							  autoComplete="off"
							  maxLength="1000"
							  placeholder="What do you want to talk about?"/>
					<Media.Body className = "mb">
						<Button
							type="submit"
							id="post"
							>
						Post
						</Button>
					</Media.Body>
			</div>
			</form>
			</div>
		);
	}
}


class Post extends React.Component{
	constructor(props) {
		super(props);
		this.handleUpvoteClick = this.handleUpvoteClick.bind(this);
		this.handleUpvoteUnclick = this.handleUpvoteUnclick.bind(this);
		this.handleDownvoteClick = this.handleDownvoteClick.bind(this);
		this.handleDownvoteUnclick = this.handleDownvoteUnclick.bind(this);
		this.handleExpand = this.handleExpand.bind(this);
		this.cutoffContent = this.cutoffContent.bind(this);
		this.handleDateClick = this.handleDateClick.bind(this);
		this.handleShowReportWindow = this.handleShowReportWindow.bind(this);
		this.handleCloseReportWindow = this.handleCloseReportWindow.bind(this);
		this.state = {
			upvoted: this.props.upvoted,
			downvoted: this.props.downvoted,
			votes: this.props.votes,
			needsExpansion: (this.props.content.length > 280
							|| this.props.content.split(/\r\n|\r|\n/).length > 3),
			expanded: false,
			reported: false,
			reportWindow: false,
		};
	}

	// TODO: think about error handling - i.e. behavior when no server connection
	sendVoteToServer(tag) {
		fetch("/api/posts/"+this.props.id+"/"+tag+"/", {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		})
	}

	// voting logic
	handleUpvoteClick(e) {
		e.stopPropagation();
		if (this.state.upvoted) {
			return;
		}
		else if (this.state.downvoted) {
			this.setState({
				upvoted : true,
				downvoted : false,
				votes : this.state.votes + 2,
			})
		}
		else {
			this.setState({
				upvoted : true,
				votes : this.state.votes + 1
			})
		}
		this.sendVoteToServer("u");
	}
	handleUpvoteUnclick(e) {
		e.stopPropagation();
		if (!this.state.upvoted) {
			return;
		}
		else {
			this.setState({
				upvoted : false,
				votes : this.state.votes - 1,
			})
		}
		this.sendVoteToServer("c");
	}
	handleDownvoteClick(e) {
		e.stopPropagation();
		if (this.state.downvoted) {
			return;
		}
		else if (this.state.upvoted) {
			this.setState({
				downvoted : true,
				upvoted : false,
				votes : this.state.votes - 2,
			})
		}
		else {
			this.setState({
				downvoted : true,
				votes : this.state.votes - 1
			})
		}
		this.sendVoteToServer("d");
	}
	handleDownvoteUnclick(e) {
		e.stopPropagation();
		if (!this.state.downvoted) {
			return;
		}
		else {
			this.setState({
				downvoted : false,
				votes : this.state.votes + 1,
			})
		}
		this.sendVoteToServer("c");
	}

	handleExpand(e) {
		e.stopPropagation();
		this.setState({
			expanded : !this.state.expanded,
		})
	}

	// prevent dropdown close when clicking 'report'
	// code from https://github.com/react-bootstrap/react-bootstrap/issues/1490
	dropdownToggle(newValue){
	    if (this._forceOpen){
	        this.setState({ menuOpen: true });
	        this._forceOpen = false;
	    } else {
	        this.setState({ menuOpen: newValue });
	    }
	}
	menuItemClickedThatShouldntCloseDropdown(){
	    this._forceOpen = true;
	    this.handleShowReportWindow();
		fetch("/api/posts/"+this.props.id+"/r/", {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		});

		this.setState({
			reported: true,
		});
	}

	// cut off content to 3 lines or 280 chars, whichever is fewer
	cutoffContent(content) {
		let newContent = content;
		if (newContent.split(/\r\n|\r|\n/).length > 3) {
			newContent = newContent.split(/\r\n|\r|\n/).slice(0,3).join('\n');
		}
		return newContent.slice(0,280)

	}

	renderContent() {
		let content = this.state.expanded
							? this.props.content + " "
							: this.cutoffContent(this.props.content) + " "


		return (
				this.state.needsExpansion
				? ( this.state.expanded
					? (<div>{content}<span className="seemore" onClick={this.handleExpand}>see less</span></div>)
					: (<div>{content}<span className="seemore" onClick={this.handleExpand}>...see more</span></div>)
				  )
			    : content
		);
	}

	handleDateClick(e) {
		e.stopPropagation();
	}


   handleCloseReportWindow() {
    	this.setState({ reportWindow: false });
  	}

  handleShowReportWindow() {
    	this.setState({ reportWindow: true });
  }

	render () {
		let date_string = timestamp(this.props.date);

		const postclass = !this.props.color
					  		? ("post")
					    	: ("post2")

		return (
			<div className={postclass} style={{borderLeft: "solid 4px", borderLeftColor: "#f19143"}}>
			  <Media className="mainBody" >
			    <Media.Left>
			    	<div className="arrowBox">
						{
							this.state.upvoted
							? <Chevron_up_clicked onClick={this.handleUpvoteUnclick}/>
							: <Chevron_up onClick={this.handleUpvoteClick}/>
						}
			    		{this.state.votes}
						{
							this.state.downvoted
							? <Chevron_down_clicked onClick={this.handleDownvoteUnclick}/>
							: <Chevron_down onClick={this.handleDownvoteClick}/>
						}
					 </div>
			    </Media.Left>
			    <Media.Body className="wrapText" onClick={this.props.onClick}>
					{this.renderContent()}
			    </Media.Body>
				<Media.Right className="dropdown-container">
					<DropdownButton pullRight
					   className="postDropdown"
					   bsSize="small"
					   title=""
					   id="dropdown-size-small"
					   open={this.state.menuOpen}
					   onToggle={val => this.dropdownToggle(val)}
					   >

					   <CopyToClipboard text={"https://princetontigertalk.herokuapp.com/post/"+this.props.id+"/"}>
					   <MenuItem >Copy link</MenuItem>
					   </CopyToClipboard>

					   { this.props.isMine
					   		? <MenuItem onClick={this.props.handleDelete}>Delete</MenuItem>
							: (this.state.reported
								? <MenuItem>Reported ✔</MenuItem>
								: <MenuItem onClick={() => this.menuItemClickedThatShouldntCloseDropdown()}>Report</MenuItem>)
				   		}
					</DropdownButton>
					<Modal show={this.state.reportWindow} onHide={this.handleCloseReportWindow}>
			          <Modal.Header closeButton>
			            <Modal.Title>Reported!</Modal.Title>
			          </Modal.Header>
			          <Modal.Body>
			            <h4>Thanks for reporting. Our team will soon review this post.</h4>
			          </Modal.Body>
			          <Modal.Footer>
			          	<Button onClick={this.handleCloseReportWindow}>Close</Button>
			          </Modal.Footer>
			        </Modal>
				</Media.Right>
			  </Media>
			  <Media className="rip">
			    <Media.Left>
			      <div className="iconFirstColumn">
				  </div>
			    </Media.Left>
			    <Media.Body onClick={this.props.onClick} className="bottom">
					<Media.Left>
				      <Speech_bubble />
				    </Media.Left>
				    <Media.Left className = "commentNum">
				      {this.props.comment_count}
				    </Media.Left>
				    <Media.Right>
				    </Media.Right>
			    </Media.Body>
			    <Media.Right onClick={this.props.onClick} className = "postDateString">
					<a className="dateString" target="_blank"
						href={"/post/"+this.props.id+"/"}
						onClick={this.handleDateClick}
						style={{color:"#696969"}}>{date_string}</a>
			    </Media.Right>
			  </Media>
		  </div>
		);
	}
}

// A post and its associated comments
class PostCommentBlock extends React.Component {
	constructor(props) {
		super(props);
		this.handleClick = this.handleClick.bind(this);
		this.handleDelete = this.handleDelete.bind(this);
		this.handleComment = this.handleComment.bind(this);
		// this.handleCommentDelete = this.handleCommentDelete.bind(this);
		this.refreshComments = this.refreshComments.bind(this);
		this.loadNewComments = this.loadNewComments.bind(this);
		this.toggleRefresh = this.toggleRefresh.bind(this);
		this.handleColorClick = this.handleColorClick.bind(this);
		this.getUserData = this.getUserData.bind(this);
		this.handleCollapsed = this.handleCollapsed.bind(this);
		
		this.state = {
			showing: false, // are the comments showing?
			isUserDataLoaded: true, // is the updated user data loaded?
			isLoaded: true, // are the comments loaded?
			comments: this.props.comments, // current list of comments
			comment_count: this.props.comment_count,
			my_comments: this.props.my_comments,
			my_upvoted: this.props.my_upvoted,
			my_downvoted: this.props.my_downvoted,
			colorclick: false,
			
		};
	}


	componentDidUpdate(prevProps, prevState) {
		if (prevProps.showing != this.props.showing ) {
			this.setState({
				showing:this.props.showing,
				colorclick:this.props.showing,
			})
			this.toggleRefresh(false);
		}
	}

	// toggle auto-refresh
	toggleRefresh(start) {
		if (!start) {
			clearInterval(this.commentTimer);
		}
		else {
			this.commentTimer = setInterval(
				() => this.loadNewComments(),
				5000 // 5 seconds
			);
		}
	}

	// get user comment data
	getUserData() {
		fetch("/api/users/"+userid+"/", {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		})
		.then(res => res.json())
		.then(
			(result) => {
				this.setState({
					my_posts: result.posts,
					my_comments: result.comments,
					my_upvoted: result.comments_upvoted,
					my_downvoted: result.comments_downvoted,
				});
			}
		)
	}

	loadNewComments() {
		this.getUserData();

		fetch("/api/posts/"+this.props.id+"/comments/", {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		})
		.then(res => res.json())
		.then(
			(result) => {
				let loadedComments = result;
				this.setState({
					comments : loadedComments,
					comment_count: loadedComments.length,
				});
			},
			(error) => {
				this.setState({
					error
				});
			}
		)

	}

	// load comments and user data from API when post is clicked
	handleClick() {
		if(!this.state.showing) {
			// get user data about comments
			this.setState({
				isUserDataLoaded: false,
			})
			fetch("/api/users/"+userid+"/", {
				method: 'GET',
				credentials: "same-origin",
				headers : new Headers(),
				headers: {
					 "X-CSRFToken": csrftoken,
					 'Accept': 'application/json',
					 'Content-Type': 'application/json',
				},
			})
			.then(res => res.json())
			.then(
				(result) => {
					this.toggleRefresh(true);
					this.setState({
						my_upvoted: result.comments_upvoted,
						my_downvoted: result.comments_downvoted,
						my_comments: result.comments,
						isUserDataLoaded: true,
					});
				}
			)
			this.setState({
				showing: true,
				colorclick: true,
			});
			this.props.handleOpen(this.props.id);
			this.refreshComments();
		}
		else {
			this.toggleRefresh(false);
			this.setState({
				showing: false,
				colorclick:false
			})
		}
	}
	handleCollapsed() {
		this.props.handleCollapsed(this.props.id);
	}

	refreshComments() {
		this.setState({showing: true, isLoaded: false});
		fetch("/api/posts/"+this.props.id+"/comments/", {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		})
		.then(res => res.json())
		.then(
			(result) => {
				if (this.state.isUserDataLoaded) {
					this.setState({
						isLoaded: true,
						comments: result,
						comment_count: result.length,
					});
				} else {
					this.refreshComments();
				}
			},
			(error) => {
				this.setState({
					isLoaded: true,
					error
				});
			}
		)
	}

	handleDelete() {
		this.props.handleDelete(this.props.id);
	}
	handleComment(id) {
		var newMyComments = this.state.my_comments.concat(id);
		this.setState({
			comment_count: this.state.comment_count + 1,
			my_comments: newMyComments,
		})
	}

	handleColorClick() {
		this.setState({
			colorclick: !this.state.colorclick,
		})
	}
	renderComments() {
		let color_list = ["#ffcdd2", "#e57373", "#af4448", "#f44336", "#7f0000",
							"#b71c1c", "#FF0000", " #FF00FF", "#c722d6", "#f06292",
							"#e91e63"," #880e4f", "#ff80ab", "#efcbff", "#8eafd6",
							"#b2d677", "#ce93d8", "#ab47bc",  "#6a1b9a", "#5c6bc0",
							"#bbdefb",  "#64b5f6", "#1565c0", "#26c6da", "#808000",
							"#008080", "#004cff", "#00cb8a", "#80cbc4", "#81c784",
							"#388e3c", "#1b5e20", "#76ff03", "#ffeb3b", "#ffecb3",
							"#fbc02d", "#a1887f", "#D2B48C", "#A0522D", "#6d4c41", "#212121"]
		color_list = shuffleSeed.shuffle(color_list, this.props.id);
		return (
			<CommentBlock
		 				color_list = {color_list}
						id={this.props.id}
						comments={this.state.comments}
						my_comments={this.state.my_comments}
						my_upvoted={this.state.my_upvoted}
						my_downvoted={this.state.my_downvoted}
						handleComment={this.handleComment}
					/>
		);
	}
	render() {
		return (
			<div>
				<Post id={this.props.id}
					  content={this.props.content}
					  votes={this.props.votes}
					  upvoted={this.props.upvoted}
					  downvoted={this.props.downvoted}
					  comment_count={this.state.comment_count}
					  date={this.props.date}
					  isMine={this.props.isMine}
					  handleDelete={this.handleDelete}
					  onClick={this.handleClick}
					  color={this.state.colorclick}
					  />

				<Collapse in={this.state.showing} onExited={this.handleCollapsed}>
					<div>
						{this.renderComments()}
					</div>
				</Collapse>
			</div>
		);
	}
}

// Spinner for loading posts
function Spinner() {
	return (
		<div style={{}}>
		<div className="lds-css ng-scope">
		<div style={{width:"100%",height:"100%"}} className="lds-dual-ring">
		<div>
		</div>
		</div>
		</div>
		</div>
	);
}

// Spinner for loading comments
// function LilSpinner() {
// 	return (
// 		<div style={{}}>
// 		<div className="lds-css ng-scope">
// 		<div style={{width:"100%",height:"100%"}} className="lds-dual-ring2">
// 		<div>
// 		</div>
// 		</div>
// 		</div>
// 		</div>
// 	);
// }

// get csrf token from cookies
// from https://stackoverflow.com/questions/35112451/forbidden-csrf-token-missing-or-incorrect-django-error
function getCookie(name) {
	var cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		var cookies = document.cookie.split(';');
		for (var i = 0; i < cookies.length; i++) {
			var cookie = jQuery.trim(cookies[i]);
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}
var csrftoken = getCookie("csrftoken");

// The main list of posts and associated post entry form (above it)
// TODO: add error handling ('could not reach server' notification)
class PostList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			error: null,
			isLoaded: false, // are any posts loaded?
			nextPageLoaded: true, // is the next page loaded?
			morePosts: true, // are there more posts to load?
			posturl: "/api/posts/",
			posts: [], // all post objects
			openPostID: null,
			newPostCount: 0, // number of posts user has added since refresh
			my_posts: [], // post ids of user's posts
			my_upvoted: [], // post ids of user's upvoted posts
			my_downvoted: [], // post ids of user's downvoted posts
			my_comments: [],
			my_upvoted_comments: [],
			my_downvoted_comments: [],
		};
		this.openPost = React.createRef();
		this.handlePost = this.handlePost.bind(this);
		this.handleDelete = this.handleDelete.bind(this);
		this.getFirstPage = this.getFirstPage.bind(this);
		this.getNextPage = this.getNextPage.bind(this);
		this.reloadPosts = this.reloadPosts.bind(this);
		this.getUserData = this.getUserData.bind(this);
		this.handleOpen = this.handleOpen.bind(this);
		this.handleCollapsed = this.handleCollapsed.bind(this);
	}

	// fetch current posts and comments upon page load
	componentDidMount() {
		this.getUserData(); // get current data for user
		this.reloadPosts(this.state.posturl); // load posts

		if (this.props.sort == "recent") {
			this.postListTimer = setInterval(
				() => this.getFirstPage(),
				15000 // 5 seconds
			);
		}
	}

	// modified from https://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
	isElementInViewport(el) {
	    //special bonus for those using jQuery
	    if (typeof jQuery === "function" && el instanceof jQuery) {
	        el = el[0];
	    }

	    var rect = el.getBoundingClientRect();

	    return (
	        rect.top >= 0 &&
	        rect.left >= 0 &&
	        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
	        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
	    );
	}

	componentDidUpdate(prevProps, prevState) {

		// update post list and refresh timer if sort type changed
		if (prevProps.sort != this.props.sort) {
		 	this.getUserData();
		 	this.reloadPosts();

			// start or stop reset timer
			if (this.props.sort == "popular") {
				clearInterval(this.postListTimer);
			}
			if (this.props.sort == "recent") {
				this.postListTimer = setInterval(
					() => this.getFirstPage(),
					5000
				);
			}
	 	}

		// check if ref to new open post is in view, and scroll if not
		// if (prevState.openPostID != this.state.openPostID) {
		// 	let openNode = this.openPost.current;
		// 	let domNode = ReactDOM.findDOMNode(openNode).firstChild;
		// 	domNode.scrollIntoView({behavior: "smooth"});
		// }
	}

	getUserData() {
		fetch("/api/users/"+userid+"/", {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		})
		.then(res => res.json())
		.then(
			(result) => {
				this.setState({
					my_posts: result.posts,
					my_upvoted: result.posts_upvoted,
					my_downvoted: result.posts_downvoted,
					my_comments: result.comments,
					my_upvoted_comments: result.comments_upvoted,
					my_downvoted_comments: result.comments_downvoted,
				});
			}
		)
	}

	reloadPosts() {
		this.setState({
			isLoaded: false,
		})

		let url = "/api/posts" + (this.props.sort === "popular" ? "/popular/" : "/");
		let curr_sort = this.props.sort;

		fetch(url, {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		})
		.then(res => res.json())
		.then(
			(result) => {
				if ((curr_sort === this.props.sort) && !this.state.isLoaded) {
					this.setState({
						isLoaded: true,
						morePosts: result.next !== null,
						posts: result.results,
						newPostCount: 0,
					});
				} else {
					if (!this.state.isLoaded) {
						this.reloadPosts();
					}
				};
			},
			(error) => {
				this.setState({
					isLoaded: true,
					error
				});
			}
		)
	}

	// get first page of post results and update current post list
	 getFirstPage() {
		this.getUserData();

		fetch("/api/posts/", {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		})
		.then(res => res.json())
		.then(
			(result) => {
				// slice new posts and add to front of current post list
				let loadedPosts = result.results;
				let oldPosts = this.state.posts.slice(this.state.newPostCount);
				for (let i = 0; i < loadedPosts.length; i++) {
					if (loadedPosts[i].id == oldPosts[0].id) {
						var firstOldPost = i;
						break;
					}
				}
				let newPosts = loadedPosts.slice(0,firstOldPost);
				this.setState({
					posts : newPosts.concat(oldPosts),
				});
			},
			(error) => {
				this.setState({
					error
				});
			}
		)
	}

	// load the next page of posts from server and add to current post list
	getNextPage() {
		// don't try to fetch posts if there are no more
		if (this.state.morePosts === false) {
			return;
		}

		// set state to trigger loading icon
		this.setState({
			nextPageLoaded : false,
		})

		let currentPostCount = this.state.posts.length;
		var url = "/api/posts" + (this.props.sort === "popular" ? "/popular/" : "/");
		fetch(url +"?offset="+currentPostCount, {
			method: 'GET',
			credentials: "same-origin",
			headers : new Headers(),
			headers: {
				 "X-CSRFToken": csrftoken,
				 'Accept': 'application/json',
				 'Content-Type': 'application/json',
			},
		})
		.then(res => res.json())
		.then(
			(result) => {
				var nextPage = result.results;
				for (let i = 0; i < nextPage.length; i++) {
					if (nextPage[i].id < this.state.posts[this.state.posts.length-1].id) {
						var firstNewPostIndex = i;
						break;
					}
				}
				this.setState({
					nextPageLoaded: true,
					morePosts: result.next !== null,
					posts: this.state.posts.concat(nextPage.slice(firstNewPostIndex)),
				});
			},
			(error) => {
				this.setState({
					nextPageLoaded: true,
					error
				});
			}
		)
	}

	// add a new post
	handlePost(text) {
		if (text.trim() != ''){
			fetch("/api/posts/", {
					method: 'POST',
					credentials: "same-origin",
					headers : new Headers(),
					headers: {
						 "X-CSRFToken": csrftoken,
						 'Accept': 'application/json',
						 'Content-Type': 'application/json',
					},
					body:JSON.stringify({
						"content":text,
					})
				})
			.then(res => res.json())
			.then(
				(result) => {
					this.setState({
						posts : [result].concat(this.state.posts),
						newPostCount : this.state.newPostCount + 1,
						my_posts : [result.id].concat(this.state.my_posts),
					});
				},
				(error) => {
					alert(error);
				}
			)
		}
	}

	// delete a post by ID
	handleDelete(id) {
		fetch("/api/posts/"+id+"/", {
				method: 'DELETE',
				credentials: "same-origin",
				headers : new Headers(),
				headers: {
					 "X-CSRFToken": csrftoken,
					 'Accept': 'application/json',
					 'Content-Type': 'application/json',
				},
			}
		)
		.then(
			(result) => {
				var newposts = this.state.posts.filter(
					function(post) {
						return post.id !== id;
					});
				this.setState({
					posts : newposts
				});
			}
		)
	}

	// set openPostID to be the id of the newly opened post, and scroll new
	// post into view if necessary when old post collapses
	handleOpen(id) {
		this.setState({
			openPostID: id,
		});
	}
	// TODO: debug based on browser
	handleCollapsed(id) {
		let openNode = this.openPost.current;
		let domNode = ReactDOM.findDOMNode(openNode).firstChild;
		if (!this.isElementInViewport(domNode)) {
			// TODO: doesn't seem to work on android
			domNode.scrollIntoView({behavior: "smooth"});

			if (isSafari) {
				var navHeight = 60;
				var scrolledY = window.scrollY;
				if(scrolledY) {
					setTimeout(window.scroll(0, scrolledY - navHeight,{behavior: "smooth"}), 100);
				}
			}
			if (isFirefox) {
				var navHeight = 200;
				var scrolledY = window.scrollY;
				if(scrolledY) {
					setTimeout(window.scroll(0, scrolledY - navHeight,{behavior: "smooth"}), 100);
				}
			}
		}
	}

	render() {
		return (
			<div>
			<PostEntryForm onClick={this.handlePost}/>
			{
				this.state.isLoaded
				? this.state.posts.map((post) =>
	          		<PostCommentBlock
						ref={post.id==this.state.openPostID ? this.openPost : null}
			   			key={"post"+ post.id}
						id={post.id}
	                	content={post.content}
						votes={post.net_votes}
						comment_count={post.comments.length}
						comments={post.comments}
						date={post.date_created}
						showing={post.id==this.state.openPostID ? true : false}
						isMine={this.state.my_posts.includes(post.id)}
						upvoted={this.state.my_upvoted.includes(post.id)}
						downvoted={this.state.my_downvoted.includes(post.id)}
						my_upvoted={this.state.my_upvoted_comments}
						my_downvoted={this.state.my_downvoted_comments}
						my_comments={this.state.my_comments}
						handleDelete={this.handleDelete}
						handleOpen={this.handleOpen}
						handleCollapsed={this.handleCollapsed}
						 />)
				: null
	        }
			{
				this.state.isLoaded && this.state.nextPageLoaded
				? <InfiniteScroll
					morePosts={this.state.morePosts}
					getNextPage={this.getNextPage} />
				: <Spinner />
			}
			</div>
		);
	}
}

class InfiniteScroll extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			morePosts : this.props.morePosts,
		}
		this.onChange = this.onChange.bind(this);
	}

	onChange(isVisible) {
		if (isVisible) {
			this.props.getNextPage();
		}
	}

	render () {
	  var VisibilitySensor = require('react-visibility-sensor');

	  if (!this.state.morePosts) {
		  return(
			  <div className="no-more-posts">
		  			No more posts!
				</div>
			);
	  }

	  return (
	    <VisibilitySensor partialVisibility={true} onChange={this.onChange} />
	  );
	}
}

class MainTitle extends React.Component {
	render() {
		return (
				<h3 className="header">TigerTalk</h3>
		);
	}
}

class NavBar extends React.Component {
	render() {
		return (
			<Navbar fixedTop collapseOnSelect fluid>
			  <Navbar.Header>
			    <Navbar.Toggle />
			  </Navbar.Header>
			  <Navbar.Collapse>
			  	<Nav pullLeft>
					<NavItem style={{ fontFamily: 'Quicksand' }} href="/about">
						About
					</NavItem>
					<NavItem href="https://docs.google.com/forms/d/e/1FAIpQLSeO1FP1ghYFiDi2AKrBsEOxu2b_NXowGbxCfrlHXFmm6b1Fug/viewform?usp=pp_url&entry.1782114317"
					target="_blank" style={{ fontFamily: 'Quicksand' }} >
						Feedback
					</NavItem>
				</Nav>
			    <Nav pullRight>
					<NavItem style={{ fontFamily: 'Quicksand' }} href="/accounts/logout">
					  Logout ({netid})
					</NavItem>
			    </Nav>
			  </Navbar.Collapse>
			</Navbar>
		);
	}
}

// Parent class which is rendered in the Django template
class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			recent : true,
		}
		this.toggleSort = this.toggleSort.bind(this);
	}

	toggleSort(sort) {
		this.setState({
			recent : sort == "recent" ? true : false,
		});
	}

	render() {
		return (
			<div>
				<NavBar />
				<MainTitle />
				<SortBar toggleSort={this.toggleSort} handleRefresh={this.handleRefresh}/>
				{
					this.state.recent
					? <PostList sort="recent" />
					: <PostList sort="popular" />
				}
			</div>
		);
	}
}

ReactDOM.render(<App />, document.getElementById('root'))
// ReactDOM.render(<SinglePost />, document.getElementById('root'))

function onActive()
{
    const notificationsWrapper = document.getElementById('notificationsWrapper');
    if (notificationsWrapper)
    {
        notificationsWrapper.setAttribute('tabindex', '0');
    }

    const notificationsDropdown = document.getElementById('notifications-dropdown');
    if (notificationsDropdown)
    {
        notificationsDropdown.classList.remove('hide');
    }
}

function onActiveOut()
{
    const notificationsWrapper = document.getElementById('notificationsWrapper');
    if (notificationsWrapper)
    {
        notificationsWrapper.setAttribute('tabindex', '-1');

        if (!document.getElementById('notificationPost').classList.contains('show'))
        {
            notificationsWrapper.focus();
        }
    }
}

function topNav(page)
{
    $.ajax({
        url: `/topNav/${page}`,
        type: 'GET',
        async: false,
        success: function(data)
        {
            document.getElementById('topNavWrapper').innerHTML = data;
        },
        error: function(error)
        {
            console.error('Error:', error);
        }
    });
}

function showSearchResults()
{
    document.getElementById('searchResultsDropdown').classList.remove('hide');
}

function hideSearchResults()
{
    document.getElementById('searchResultsDropdown').classList.add('hide');
}

function showNotifications()
{
    document.getElementById('notifications-dropdown').classList.remove('hide');
}

function hideNotifications()
{
    document.getElementById('notifications-dropdown').classList.add('hide');
}

function showProfile()
{
    document.getElementById('profile-dropdown').classList.remove('hide');
}

function hideProfile()
{
    if (document.activeElement !== document.getElementById('profileWrapper'))
    {
        document.getElementById('profile-dropdown').classList.add('hide');
    }
}

function displayDataNav(data, newComment=false, topNav=false, modal="")
{
    let html = '';

    data.forEach(e =>
    {
        if (typeof e._id !== 'string')
        {
            console.log(typeof e)
        }

        if (newComment)
        {
            if (modal === "modal")
            {
                html += `${createTableRowNav(e, true, true)}`;
            }
            else
            {
                html += `${createTableRowNav(e, true, false)}`;
            }
            
            const node = createNodeFromHTMLNav(html);

            let parentElement;
            let toReplaceElement;

            if (!topNav)
            {
                parentElement = document.getElementById(`parent${e._id}`);
                toReplaceElement = document.getElementById(`${e._id}${modal}`);
            }
            else
            {
                parentElement = document.getElementById(`thePost`);
                toReplaceElement = document.getElementById(`${e._id}${modal}`);
            }

            parentElement.replaceChild(node, toReplaceElement);
        }
        else
        {
            html +=
            `<div id="parent${e._id}" style="background: #FFFFFF; width: 80%; padding: 16px; margin-top: 30px; border-radius: 10px;">
                ${createTableRowNav(e, false, false)}
            </div>`;
        }
    });

    if (!newComment)
    {
        $(`#post-list`).append(html);
    }
}

function getNotificationPost(postId)
{
    $.ajax({
        url: `/get-post/${postId}`,
        type: 'GET',
        success: function(data)
        {
            if (data.length > 0)
            {
                let user;
                let profileImg;

                if (typeof data[0].user.name !== 'undefined')
                {
                    user = data[0].user.name;

                    if (data[0].user.profileImg !== '' && data[0].user.profileImg !== null && data[0].user.profileImg !== undefined)
                    {
                        profileImg = data[0].user.profileImg;
                    }
                    else
                    {
                        profileImg = '';
                    }
                }
                else
                {
                    user = document.getElementById('user').value;
                    profileImg = document.getElementById('img').value;
                }

                if (profileImg.length <= 5)
                {
                    profileImg =
                    `<div class="placeholder-profile" style="height: 50px; width: 50px; border-radius: 50%; background: #F0F2F5; display: flex; justify-content: center; align-items: center;">
                        <i class="fa-solid fa-user" style="font-size: 1.2rem;"></i>
                    </div>`;
                }
                else
                {
                    profileImg =
                    `<img src="${profileImg}" class="currentImgURL" alt="profile Image" />`;
                }

                $('#profileAndUser-notification').html(
                    `<div style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; flex-wrap: nowrap;">
                        <div style="border-radius: 50%; display: flex; height: 75px; width: 75px; justify-content: center; align-items: center; overflow: hidden;">
                            ${profileImg}
                        </div>
                        <div style="margin-left: 10px;">${user}</div>
                    </div>`
                );
            }
            
            $('#thePost').empty().append(createTableRowNav(data, false, "modalWidth"));
        },
        error: function(error)
        {
            console.error("error: " + error);
        }
    });

    $('#notificationPost').modal('show');
}

function createNodeFromHTMLNav(htmlString)
{
    const parser = new DOMParser();

    const doc = parser.parseFromString(htmlString, 'text/html');

    return doc.body.firstChild;
}

function createTableRowNav(result, isNewComment=false, isModal=false)
{
    let user;
    if (typeof result.user.name !== 'undefined')
    {
        user = result.user.name;
    }
    else
    {
        user = document.getElementById('user').value;
    }

    let totalComments = 0;
    for (let i = 0; i < result.comments.length; i++)
    {
        if (result.comments[i].comments.length > 0)
        {
            totalComments += result.comments[i].comments.length;
        }
        totalComments += 1;
    }

    let modalStyling;
    let modal= "";

    if (isModal)
    {
        modalStyling = "modalWidth";
        modal = "modal";
    }

    // different profile image styles
    let profileImg1 = userProfileImageNav(50, result.user);
    const profileImg2 = userProfileImageNav(40, result.user);
    const profileImg3 = userProfileImageNav(35, result.user);

    let postElement =
    `<div id="${result._id}${modal}" class="${modalStyling}">
        <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; flex-wrap: nowrap; width: 100%;">
            <div style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; flex-wrap: nowrap;">`;

            // if not a modal, then give the buttons that display the modal
            if (!isModal)
            {
                postElement +=
                `<div>
                    <button type="button" class="noStyle" onclick="getUserPostsNav('${user}');">${profileImg1}</button>
                </div>
                <div style="margin-left: 10px; display: flex; flex-direction: column;">
                    <div><button type="button" class="noStyle" onclick="getUserPostsNav('${user}');">${user}</button></div>
                    <div style="color: #65676B;">${formatDate(result.createdAt)}</div>
                </div>
            </div>`;
            }
            else
            {
                postElement +=
                `<div>
                    ${profileImg1}
                </div>
                <div style="margin-left: 10px; display: flex; flex-direction: column;">
                    <div>${user}</div>
                    <div style="color: #65676B;">${formatDate(result.createdAt)}</div>
                </div>
            </div>`;
            }

    if (user === document.getElementById('currentUser').value)
    {
        postElement +=
            `<div style="position: relative">
                <button type="button" class="noStyle" style="color: black;" onclick="deletePostNav('${result._id}', '${modal}');"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        </div>`;
    }
    else
    {
        postElement += 
        '</div>';
    }

    if (result.text && result.text.length > 0)
    {
        postElement +=
        `<div style="margin-top: 15px;">${result.text}</div>`;
    }
        
    if (result.img)
    {
        postElement +=
        `<div style="margin-top: 15px; display: flex; flex-direction: row; justify-content: center;">
            <div style="width: 100%">
                <img src="${result.img}" alt="post image" style="border-radius: 10px; max-width: 100%;" />
            </div>
        </div>`;
    }

    postElement +=
        `<div style="display: flex; flex-direction: row; justify-content: space-between;">
            <div style="margin-top: 15px;"><i class="fa-regular fa-thumbs-up"></i> <span id="${result._id}Likes${modal}">${result.likes.length}</span></div>
            <div style="margin-top: 15px;">${totalComments} <i class="fa-solid fa-comment"></i></div>
        </div>
        <br />
        <div style="display: flex; flex-direction: row; flex-wrap: nowrap; border-top: 1px solid #CED0D4; border-bottom: 1px solid #CED0D4; padding: 5px 0 5px 0;">
            <div style="width: 50%;">
                <button type="button" onclick="likeOrUnlikePostNav('${result._id}', '${modal}');" class="noStyle likeCommentButton">
                    <div>
                        <i class="fa-regular fa-thumbs-up"></i><span style="margin-left: 10px;">Like</span>
                    </div>
                </button>
            </div>
            <div style="width: 50%;">
                <button type="button" onclick="clickComment('${result._id}', '${modal}');" class="noStyle likeCommentButton">
                    <div>
                        <i class="fa-regular fa-comment"></i><span style="margin-left: 10px;">Comment</span>
                    </div>
                </button>
            </div>
        </div>
        <div id="${result._id}comments">`;

        const comment1Index = result.comments.length - 1;

    // adds comments
    // if more than 1 comment, show most recent comment and a button to view all comments
    if (totalComments > 1)
    {
        const comment1 = result.comments[comment1Index];
        const comment1Replies = comment1.comments;
        const comment1RepliesLength = comment1Replies.length;
        let profileImg4 = userProfileImageNav(40, comment1.user);

            postElement +=
            `<div style="margin-top: 10px">
                <button class="noStyle" onclick="showComments('${result._id}', this, '${modal}')" style="color: #65676b;">View all comments</button>
            </div>
            <div style="display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; width: 100%;">
                <div style="margin-top: 15px; padding-right: 10px; display: flex; flex-direction: column; width: 50px;">
                    ${profileImg4}`;
                
                // replies pipe
                if (comment1RepliesLength > 0)
                {
                    postElement +=
                    `<div id="${comment1._id}replyPipe" class="pastReplyPipe${result._id}${modal}" style="display: none; height: calc(100% - 40px); width: 50px; padding-top: 5px;">
                        <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 20px;"></div>
                    </div>`;
                }
            
                postElement +=
                    `<div class="${comment1._id}replyPipe${modal} replyPipe${modal}" style="display: none; height:  100% ; width: 50px;">
                        <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 20px;"></div>
                    </div>
                </div>
                <div style="margin-top: 15px;width: 100%">
                    <div style="background: #F0F2F5; padding: 8px; border-radius: 10px;">
                        <div style="font-weight: 700; font-size: 13px;">${comment1.user.name}</div>
                        <div style="font-size: 15px;">${comment1.text}</div>
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between">
                        <div style="display: flex; flex-direction: row; justify-content: flex-start">
                            <div style="color: #65676b; font-size: 13px; margin-top: 4px;">${formatDate(comment1.createdAt)}</div>
                            <div><button class="noStyle commentButtons" onclick="likeOrUnlikeCommentNav('${result._id}', '${comment1._id}', '${modal}');">Like</button></div>
                            <div><button class="noStyle commentButtons" onclick="replyOnCommentNavText('${comment1._id}', '', '${modal}');">Reply</button></div>
                        </div>
                        <div style="margin-top: 5px;">
                            <i class="fa-regular fa-thumbs-up"></i> <span id="${comment1._id}Likes${modal}">${comment1.likes.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        // replies abbreviated
        if (comment1RepliesLength > 0)
        {
            let repliesAmount;
            if (comment1RepliesLength > 1)
            {
                repliesAmount = `${comment1RepliesLength} Replies`;
            }
            else
            {
                repliesAmount = `${comment1RepliesLength} Reply`;
            }

            let profileImg4 = userProfileImageNav(35, comment1Replies[comment1RepliesLength - 1].user);
        
        postElement +=
        `<div  id="${comment1._id}replyAbbreviated${modal}" style="display: flex; flex-direction: row; flex-wrap: nowrap; width: 100%;">
            <div style="display: flex; flex-direction: column;">
                <div id="${comment1._id}replyPipe${modal}" class="pastReplyPipe${result._id}${modal}" style="display: none; height: 33px; width: 50px; padding-right: 5px;">
                    <div style="border-bottom: 2px solid #d8d9dc; border-left: 2px solid #d8d9dc; border-bottom-left-radius: 7px; height: 33px; margin-left: 20px;"></div>
                </div>
                <div class="${comment1._id}replyPipe${modal} replyPipe${modal}" style="display: none; height: 100%;">
                    <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 20px;"></div>
                </div>
            </div>
            <div class="replyAbbreviated${result._id}${modal}" onclick="displayReplies('${comment1._id}', '${modal}')" style="display: none; flex-direction: row; align-items: center; margin-top: 15px;">
                <div>${profileImg4}</div>
                <div class="hiddenReply">${comment1Replies[comment1RepliesLength - 1].user.name} replied · ${repliesAmount}</div>
            </div>
        </div>
        <div id="allReplies${comment1._id}${modal}" style="display: none; flex-direction: column; width: 100%;">`;

            // comment 1 replies
            for (let i = 0; i < comment1RepliesLength; i++)
            {
                // replied user's profile image
                let profileImg5 = userProfileImageNav(35, comment1Replies[i].user);

            postElement +=
            `<div style="display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; width: 100%;">
                <div style="display: flex; flex-direction: column;">
                    <div id="${comment1Replies[i]._id}replyPipe" class="pastReplyPipe${comment1._id}${modal}" style="display: block; height: 33px; width: 50px; padding-right: 5px;">
                        <div style="border-bottom: 2px solid #d8d9dc; border-left: 2px solid #d8d9dc; border-bottom-left-radius: 7px; height: 33px; margin-left: 20px;"></div>
                    </div>`
                    if (i !== comment1RepliesLength - 1)
                    {
                        postElement +=
                    `<div class="${comment1Replies[i]._id}replyPipe${modal}" style="display: block; height: 100%;">
                        <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 20px;"></div>
                    </div>`
                    }
                    else
                    {
                        postElement +=
                    `<div class="${comment1._id}replyPipe${modal} replyPipe${modal}" style="display: none; height:  100% ;">
                        <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 20px;"></div>
                    </div>`
                    }
                postElement +=
                `</div>
                <div style="display: flex; flex-direction: column; width: 100%;">
                    <div style="margin-top: 15px; display: flex; flex-direction: row; width: 100%;">
                        <div style="display: flex; flex-direction: column;">
                            <div>${profileImg5}</div>
                            <div class="${comment1Replies[i]._id}replyPipe${modal} replyPipe${modal}" style="height: calc(100% - 35px); padding-top: 5px; display: none;">
                                <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 17px;"></div>
                            </div>
                        </div>
                        <div style="margin-left: 10px; width: 100%;">
                            <div style="background: #F0F2F5; padding: 8px; border-radius: 10px;">
                                <div style="font-weight: 700; font-size: 13px;">${comment1Replies[i].user.name}</div>
                                <div style="font-size: 15px;">${comment1Replies[i].text}</div>
                            </div>
                            <div style="display: flex; flex-direction: row; justify-content: space-between">
                                <div style="display: flex; flex-direction: row; justify-content: flex-start">
                                    <div style="color: #65676b; font-size: 13px; margin-top: 4px;">${formatDate(comment1Replies[i].createdAt)}</div>
                                    <div><button class="noStyle commentButtons" onclick="likeOrUnlikeReplyNav('${result._id}', '${comment1._id}', '${comment1Replies[i]._id}', '${modal}');">Like</button></div>
                                    <div><button class="noStyle commentButtons" onclick="replyOnCommentNavText('${comment1Replies[i]._id}', '${comment1Replies[i].user.name}', '${modal}');">Reply</button></div>
                                </div>
                                <div style="margin-top: 5px;">
                                    <i class="fa-regular fa-thumbs-up"></i> <span id="${comment1Replies[i]._id}Likes${modal}">${comment1Replies[i].likes.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="${comment1Replies[i]._id}${modal}" class="replyInput${modal}" style="display: none; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; width: 100%;">
                        <div style="width: 50px; padding-right: 5px;">
                            <div style="border-bottom: 2px solid #d8d9dc; border-left: 2px solid #d8d9dc; border-bottom-left-radius: 7px; height: 33px; margin-left: 17px;"></div>
                        </div>
                        <div style="display: flex; flex-direction: row; width: calc(100% - 50px);">
                            <div style="margin-top: 15px; padding-right: 10px;">${profileImg3}</div>
                            <div class="input-group" style="margin-top: 15px;">
                                <input type="text" class="form-control" onFocusOut="buttonBlueOut('${comment1Replies[i]._id}', '${modal}')" 
                                onfocus="buttonBlue('${comment1Replies[i]._id}', '${modal}')" id="${comment1Replies[i]._id}Text${modal}" 
                                style="width: 100%; height: 40px; border-radius: 20px; background: #F0F2F5" />
                                <button class="noStyle input-group-append" type="button" onclick="replyOnCommentNav('${result._id}', '${comment1._id}', '${comment1Replies[i]._id}', '${modal}');">
                                    <i class="fa-regular fa-paper-plane" id="${comment1Replies[i]._id}icon${modal}"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`;

            // replies to replies
            postElement +=
            `</div>`;
            }
        postElement +=
        `</div>`;
        }

        postElement +=
        `<div style="display: none; flex-direction: row; flex-wrap: nowrap; width: 100%;" class="replyInput${modal}" id="${comment1._id}${modal}">
            <div style="width: 50px; padding-right: 5px;">
                <div style="border-bottom: 2px solid #d8d9dc; border-left: 2px solid #d8d9dc; border-bottom-left-radius: 7px; height: 33px; margin-left: 20px;"></div>
            </div>
            <div style="display: flex; flex-direction: row; width: calc(100% - 50px);">
                <div style="margin-top: 15px; padding-right: 10px;">${profileImg3}</div>
                <div class="input-group" style="margin-top: 15px;">
                    <input type="text" class="form-control" onFocusOut="buttonBlueOut('${comment1._id}', '${modal}')" 
                    onfocus="buttonBlue('${comment1._id}', '${modal}')" id="${comment1._id}Text${modal}" 
                    style="width: 100%; height: 40px; border-radius: 20px; background: #F0F2F5" />
                    <button class="noStyle input-group-append" type="button" onclick="replyOnCommentNav('${result._id}', '${comment1._id}', '${comment1._id}', '${modal}');">
                        <i class="fa-regular fa-paper-plane" id="${comment1._id}icon${modal}"></i>
                    </button>
                </div>
            </div>
        </div>
        <div id="hiddenComments${result._id}${modal}" style="display: none">`;

        // hidden unless clicked to show all comments ^
        for (let i = comment1Index - 1; i >= 0; i--) //comments shown in descending order
        {
            let commentN = result.comments[i];
            let commentNReplies = commentN.comments;
            let commentNRepliesLength = commentNReplies.length;
            let profileImg4 = userProfileImageNav(40, commentN.user);

            postElement +=
            `<div style="display: flex; flex-direction: row; flex-wrap: nowrap; width: 100%;">
                <div style="margin-top: 15px; padding-right: 10px; display: flex; flex-direction: column;">
                    ${profileImg4}`;
                
                // replies pipe
                if (commentNRepliesLength > 0)
                {
                    postElement +=
                    `<div id="${commentN._id}pipe" class="pastReplyPipe${result._id}${modal}" style="display: none; height: calc(100% - 40px); padding-top: 4px; width: 50px">
                        <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 20px;"></div>
                    </div>`;
                }
                    
                postElement +=
                    `<div class="${commentN._id}replyPipe${modal} replyPipe${modal}" style="display: none;  height: calc(100% - 40px); width: 50px;">
                        <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 20px;"></div>
                    </div>
                </div>
                <div style="margin-top: 15px; width: 100%">
                    <div style="background: #F0F2F5; padding: 8px; border-radius: 10px;">
                        <div style="font-weight: 700; font-size: 13px;">${commentN.user.name}</div>
                        <div style="font-size: 15px;">${commentN.text}</div>
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between">
                        <div style="display: flex; flex-direction: row; justify-content: flex-start">
                            <div style="color: #65676b; font-size: 13px; margin-top: 4px;">${formatDate(commentN.createdAt)}</div>
                            <div><button class="noStyle commentButtons" onclick="likeOrUnlikeCommentNav('${result._id}', '${commentN._id}', '${modal}');">Like</button></div>
                            <div><button class="noStyle commentButtons" onclick="replyOnCommentNavText('${commentN._id}', '', '${modal}');">Reply</button></div>
                        </div>
                        <div style="margin-top: 5px;">
                            <i class="fa-regular fa-thumbs-up"></i> <span id="${commentN._id}Likes${modal}">${commentN.likes.length}</span>
                        </div>
                    </div>
                </div>
            </div>`;

            // replies abbreviated
            if (commentNRepliesLength > 0)
            {
                let repliesAmount;
                if (commentNRepliesLength > 1)
                {
                    repliesAmount = `${commentNRepliesLength} Replies`;
                }
                else
                {
                    repliesAmount = `${commentNRepliesLength} Reply`;
                }

                let profileImg4 = userProfileImageNav(35, commentNReplies[commentNRepliesLength - 1].user);

                postElement +=
            `<div  id="${commentN._id}replyAbbreviated${modal}" style="display: flex; flex-direction: row; flex-wrap: nowrap; width: 100%;">
                <div style="display: flex; flex-direction: column;">
                    <div id="${commentN._id}replyPipe${modal}" class="pastReplyPipe${result._id}${modal}" style="display: none; height: 33px; width: 50px; padding-right: 5px;">
                        <div style="border-bottom: 2px solid #d8d9dc; border-left: 2px solid #d8d9dc; border-bottom-left-radius: 7px; height: 33px; margin-left: 20px;"></div>
                    </div>
                    <div class="${commentN._id}replyPipe${modal} replyPipe${modal}" style="display: none; height:  100% ;">
                        <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 20px;"></div>
                    </div>
                </div>
                <div class="replyAbbreviated${result._id}${modal}" onclick="displayReplies('${commentN._id}', '${modal}')" style="display: none; flex-direction: row; align-items: center; margin-top: 15px;">
                    <div>${profileImg4}</div>
                    <div class="hiddenReply">${commentNReplies[commentNRepliesLength - 1].user.name} replied · ${repliesAmount}</div>
                </div>
            </div>
            <div id="allReplies${commentN._id}${modal}" style="display: none; flex-direction: column; width: 100%;">`;
            
                // comment 1 replies
                for (let j = 0; j < commentNRepliesLength; j++)
                {
                    // replied user's profile image
                    let profileImg5 = userProfileImageNav(35, commentNReplies[j].user);

                postElement +=
                `<div style="display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; width: 100%;">
                    <div style="display: flex; flex-direction: column;">
                        <div id="${commentNReplies[j]._id}replyPipe" class="pastReplyPipe${commentN._id}${modal}" style="display: block; height: 33px; width: 50px; padding-right: 5px;">
                            <div style="border-bottom: 2px solid #d8d9dc; border-left: 2px solid #d8d9dc; border-bottom-left-radius: 7px; height: 33px; margin-left: 20px;"></div>
                        </div>`
                        if (j !== commentNRepliesLength - 1)
                        {
                            postElement +=
                        `<div class="${commentNReplies[j]._id}replyPipe${modal}" style="display: block; height: 100%;">
                            <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 20px;"></div>
                        </div>`
                        }
                        else
                        {
                            postElement +=
                        `<div class="${commentN._id}replyPipe${modal} replyPipe${modal}" style="display: none; height: 100%;">
                            <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 20px;"></div>
                        </div>`
                        }
                    postElement +=
                    `</div>
                    <div style="display: flex; flex-direction: column; width: 100%;">
                        <div style="margin-top: 15px; display: flex; flex-direction: row; width: 100%;">
                            <div style="display: flex; flex-direction: column;">
                                <div>${profileImg5}</div>
                                <div class="${commentNReplies[j]._id}replyPipe${modal} replyPipe${modal}" style="height: calc(100% - 35px); padding-top: 5px; display: none;">
                                    <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 17px;"></div>
                                </div>
                            </div>
                            <div style="margin-left: 10px; width: 100%;">
                                <div style="background: #F0F2F5; padding: 8px; border-radius: 10px;">
                                    <div style="font-weight: 700; font-size: 13px;">${commentNReplies[j].user.name}</div>
                                    <div style="font-size: 15px;">${commentNReplies[j].text}</div>
                                </div>
                                <div style="display: flex; flex-direction: row; justify-content: space-between">
                                    <div style="display: flex; flex-direction: row; justify-content: flex-start">
                                        <div style="color: #65676b; font-size: 13px; margin-top: 4px;">${formatDate(commentNReplies[j].createdAt)}</div>
                                        <div><button class="noStyle commentButtons" onclick="likeOrUnlikeReplyNav('${result._id}', '${commentN._id}', '${commentNReplies[j]._id}', '${modal}');">Like</button></div>
                                        <div><button class="noStyle commentButtons" onclick="replyOnCommentNavText('${commentNReplies[j]._id}', '${commentNReplies[j].user.name}', '${modal}');">Reply</button></div>
                                    </div>
                                    <div style="margin-top: 5px;">
                                        <i class="fa-regular fa-thumbs-up"></i> <span id="${commentNReplies[j]._id}Likes${modal}">${commentNReplies[j].likes.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="${commentNReplies[j]._id}${modal}" class="replyInput${modal}" style="display: none; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; width: 100%;">
                            <div style="width: 50px; padding-right: 5px;">
                                <div style="border-bottom: 2px solid #d8d9dc; border-left: 2px solid #d8d9dc; border-bottom-left-radius: 7px; height: 33px; margin-left: 17px;"></div>
                            </div>
                            <div style="display: flex; flex-direction: row; width: calc(100% - 50px);">
                                <div style="margin-top: 15px; padding-right: 10px;">${profileImg3}</div>
                                <div class="input-group" style="margin-top: 15px;">
                                    <input type="text" class="form-control" onFocusOut="buttonBlueOut('${commentNReplies[j]._id}', '${modal}')" 
                                    onfocus="buttonBlue('${commentNReplies[j]._id}', '${modal}')" id="${commentNReplies[j]._id}Text${modal}" 
                                    style="width: 100%; height: 40px; border-radius: 20px; background: #F0F2F5" />
                                    <button class="noStyle input-group-append" type="button" onclick="replyOnCommentNav('${result._id}', '${commentN._id}', '${commentNReplies[j]._id}', '${modal}');">
                                        <i class="fa-regular fa-paper-plane" id="${commentNReplies[j]._id}icon${modal}"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;

                // replies to replies
                postElement +=
                `</div>`;
                }
            postElement +=
            `</div>`;
            }

            // reply input
            postElement +=
            `<div style="display: none; flex-direction: row;" class="replyInput${modal}" id="${commentN._id}${modal}">
                <div style="width: 50px; padding-right: 5px;">
                    <div style="border-bottom: 2px solid #d8d9dc; border-left: 2px solid #d8d9dc; border-bottom-left-radius: 7px; height: 33px; margin-left: 20px;"></div>
                </div>
                <div style="display: flex; flex-direction: row; width: calc(100% - 50px);">
                    <div style="margin-top: 15px; padding-right: 10px;">${profileImg3}</div>
                    <div class="input-group" style="margin-top: 15px;">
                        <input type="text" class="form-control" onFocusOut="buttonBlueOut('${commentN._id}', '${modal}')" onfocus="buttonBlue('${commentN._id}', '${modal}')" id="${commentN._id}Text${modal}" style="width: 100%; height: 40px; border-radius: 20px; background: #F0F2F5" />
                        <button class="noStyle input-group-append" type="button" onclick="replyOnCommentNav('${result._id}', '${commentN._id}', '${commentN._id}', '${modal}');">
                            <i class="fa-regular fa-paper-plane" id="${commentN._id}icon${modal}"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        }
    }
    else
    {
        const comment1 = result.comments[0];
        let profileImg4 = userProfileImageNav(40, comment1.user);

        if (result.comments[0])
        {
            postElement +=
            `<div style="display: flex; flex-direction: row; flex-wrap: nowrap; justify-content: space-between; width: 100%;">
                <div style="display: flex; flex-direction: column;">
                    <div style="margin-top: 15px; padding-right: 10px;">
                        ${profileImg4}
                    </div>
                    <div class="${result.comments[0]._id}replyPipe${modal} replyPipe${modal}" style="display: none; height: calc(100% - 40px); width: 50px; padding-top: 5px;">
                        <div style="border-left: 2px solid #d8d9dc; height: 100%; margin-left: 20px;"></div>
                    </div>
                </div>
                <div style="margin-top: 15px;width: 100%">
                    <div style="background: #F0F2F5; padding: 8px; border-radius: 10px;">
                        <div style="font-weight: 700; font-size: 13px;">${result.comments[0].user.name}</div>
                        <div style="font-size: 15px;">${result.comments[0].text}</div>
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-between; flex-wrap: nowrap;">
                        <div style="display: flex; flex-direction: row; justify-content: flex-start">
                            <div style="color: #65676b; font-size: 13px; margin-top: 4px;">${formatDate(result.comments[0].createdAt)}</div>
                            <div><button class="noStyle commentButtons" onclick="likeOrUnlikeCommentNav('${result._id}', '${result.comments[0]._id}', '${modal}');">Like</button></div>
                            <div><button class="noStyle commentButtons" onclick="replyOnCommentNavText('${result.comments[0]._id}', '', '${modal}');">Reply</button></div>
                        </div>
                        <div style="margin-top: 5px;">
                            <i class="fa-regular fa-thumbs-up"></i> <span id="${result.comments[0]._id}Likes${modal}">${result.comments[0].likes.length}</span>
                        </div>
                    </div>
                </div>
            </div>                    
            <div style="display: none; flex-direction: row;" class="replyInput${modal}" id="${result.comments[0]._id}">
                <div style="width: 50px; padding-right: 5px;">
                    <div style="border-bottom: 2px solid #d8d9dc; border-left: 2px solid #d8d9dc; border-bottom-left-radius: 7px; height: 33px; margin-left: 20px;"></div>
                </div>
                <div style="display: flex; flex-direction: row; width: calc(100% - 50px);">
                    <div style="margin-top: 15px; padding-right: 10px;">${profileImg2}</div>
                    <div class="input-group" style="margin-top: 15px;">
                        <input type="text" class="form-control" onFocusOut="buttonBlueOut('${result.comments[0]._id}', '${modal}')" onfocus="buttonBlue('${result.comments[0]._id}', '${modal}')" id="${result.comments[0]._id}Text${modal}" style="width: 100%; height: 40px; border-radius: 20px; background: #F0F2F5" />
                        <button class="noStyle input-group-append" type="button" onclick="replyOnCommentNav('${result._id}', '${result.comments[0]._id}', '${result.comments[0]._id}', '${modal}');">
                            <i class="fa-regular fa-paper-plane" id="${result.comments[0]._id}icon${modal}"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        }
    }

    // write comment bubble at the bottom
    if (!isNewComment)
    {
    postElement +=
            `</div>
            <div style="display: flex; flex-direction: row;">
                <div style="margin-top: 15px; padding-right: 10px;">${profileImg2}</div>
                <div class="input-group" style="margin-top: 15px;">
                    <input type="text" class="form-control" onFocusOut="buttonBlueOut('${result._id}}', '${modal}')" onfocus="buttonBlue('${result._id}}', '${modal}')" id="makeCommentNav${result._id}${modal}" id="postText" placeholder="Write comment..." style="width: 100%; height: 40px; border-radius: 20px; background: #F0F2F5" />
                    <button class="noStyle input-group-append" type="button" onclick="makeCommentNav('${result._id}', '${modal}');">
                        <i class="fa-regular fa-paper-plane" id="${result._id}}icon${modal}"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }

    return postElement;
}

function userProfileImageNav(size, notification)
{
    let profileImg = notification.profileImg;

    if (profileImg === ''
    || profileImg === null
    || profileImg === undefined)
    {
        profileImg = '';
    }

    if (profileImg.length <= 5)
    {
        profileImg = 
        `<div style="width: ${size}px;">
            <div class="placeholder-profile" style="height: ${size}px; width: ${size}px; border-radius: 50%; background: #F0F2F5; display: flex; justify-content: center; align-items: center;">
                <i class="fa-solid fa-user" style="font-size: 1.2rem;"></i>
            </div>
        </div>`;
    }
    else
    {
        profileImg =
        `<div style="height: ${size}px; width: ${size}px; display: flex; justify-content: center; align-items: center; overflow: hidden; border-radius: 50%;" >
            <img src="${profileImg}" style="height: auto; width: 100%; object-fit: contain; border-radius: 50%; min-height: 50px;" alt="profile Image"/>
        </div>`;
    }
    return profileImg;
}

function formatDate(dateString)
{
    if (!dateString)
    {
        return '';
    }
    else
    {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0)
        {
            return 'Today';
        }
        else if (diffDays === 1)
        {
            return 'Yesterday';
        }
        else if (diffDays <= 7)
        {
            return `${diffDays} days ago`;
        }
        else
        {
            return date.toLocaleDateString();
        }
    }
}

function showComments(postID, clickedButton, modal)
{
    const hiddenComments = document.getElementById(`hiddenComments${postID}${modal}`);
    const hiddenReplies = document.getElementsByClassName(`pastReplyPipe${postID}${modal}`);
    const hiddenReplyAbbreviated = document.getElementsByClassName(`replyAbbreviated${postID}${modal}`);

    if (hiddenComments.style.display === 'none')
    {
        hiddenComments.style.display = 'block';
        clickedButton.innerText = 'Hide comments';
        
        for (let i = 0; i < hiddenReplies.length; i++)
        {
            hiddenReplies[i].style.display = 'block';
        }
        for (let i = 0; i < hiddenReplyAbbreviated.length; i++)
        {
            hiddenReplyAbbreviated[i].style.display = 'flex';
        }
    }
    else
    {
        hiddenComments.style.display = 'none';
        clickedButton.innerText = 'View all comments';

        for (let i = 0; i < hiddenReplies.length; i++)
        {
            hiddenReplies[i].style.display = 'none';
        }
        for (let i = 0; i < hiddenReplyAbbreviated.length; i++)
        {
            hiddenReplyAbbreviated[i].style.display = 'none';
        }
    }
}

function replyOnCommentNavText(textElement, user='', modal)
{
    for (let i = 0; i < document.getElementsByClassName(`replyInput${modal}`).length; i++)
    {
        document.getElementsByClassName(`replyInput${modal}`)[i].style.display = 'none';
        document.getElementsByClassName(`replyPipe${modal}`)[i].style.display = 'none';
    }

    for (let i = 0; i < document.getElementsByClassName(`${textElement}replyPipe${modal}`).length; i++)
    {
        document.getElementsByClassName(`${textElement}replyPipe${modal}`)[i].style.display = 'block';
    }

    // if its a reply to a reply
    if (user !== '')
    {
        document.getElementById(`${textElement}Text${modal}`).value = `${user} `;
    }
    
    document.getElementById(`${textElement}${modal}`).style.display = 'flex';
    document.getElementById(`${textElement}Text${modal}`).focus();
}

function displayReplies(commentID, modal)
{
    const hiddenReplies = document.getElementById(`allReplies${commentID}${modal}`);
    const hiddenReplyAbbreviated = document.getElementById(`${commentID}replyAbbreviated${modal}`);

    if (hiddenReplies.style.display === 'none')
    {
        hiddenReplies.style.display = 'flex';
        hiddenReplyAbbreviated.style.display = 'none';
    }
    else
    {
        hiddenReplies.style.display = 'none';
        hiddenReplyAbbreviated.style.display = 'flex';
    }
}

function allUserPostsArray(data)
{
    let postElement = 
    `<div style="background: #FFFFFF; width: 95%; padding: 16px; margin-top: 30px; border-radius: 10px;">
        <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; flex-wrap: nowrap; width: 100%;">
            <div style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; flex-wrap: nowrap;">
                <div>${formatDate(data.createdAt)}</div>
            </div>
        </div>
        <div style="margin-top: 15px;">${data.text}</div>
        <div style="display: flex; flex-direction: row; justify-content: space-between;">
            <div style="margin-top: 15px;">
                <i class="fa-regular fa-thumbs-up"></i> <span id="${data._id}Likes${modal}">${data.likes.length}</span>
            </div>
            <div style="margin-top: 15px;">${data.comments.length} <i class="fa-solid fa-comment"></i></div>
        </div>
        <div id="modalComments">`;

    // adds comments
    for (let i = data.comments.length - 1; i >= 0; i--)
    {
        postElement +=
        `<div style="margin-top: 15px;">${data.comments[i].text}</div>`;
    }

    postElement +=
        `</div>
        <br />

        <div style="display: flex; flex-direction: row; flex-wrap: nowrap; border-top: 1px solid #CED0D4; border-bottom: 1px solid #CED0D4; padding: 5px 0 5px 0;">
            <div style="width: 50%;">
                <button type="button" onclick="likeOrUnlikePostNav('${data._id}', '${modal}');" class="noStyle likeCommentButton">
                    <div>
                        <i class="fa-regular fa-thumbs-up"></i><span style="margin-left: 10px;">Like</span>
                    </div>
                </button>
            </div>
            <div style="width: 50%;">
                <button type="button" onclick="clickComment('${data._id}', '${modal}');" class="noStyle likeCommentButton">
                    <div>
                        <i class="fa-regular fa-comment"></i><span style="margin-left: 10px;">Comment</span>
                    </div>
                </button>
            </div>
        </div>

        <div class="input-group" style="margin-top: 15px;">
            <input type="text" class="form-control" id="makeCommentNav${data._id}${modal}" onFocusOut="buttonBlueOut('${data._id}', ${modal})" onfocus="buttonBlue('${data._id}', ${modal})" id="postText" placeholder="Write comment..." style="width: 100%; height: 40px; border-radius: 20px; background: #F0F2F5" />
            <button class="noStyle input-group-append" type="button" onclick="makeCommentNav('${data._id}', ${modal});">
                <i class="fa-regular fa-paper-plane" id="${data._id}icon${modal}"></i>
            </button>
        </div>
    </div>`;

    return postElement
}

function makeCommentNav(postId, modal)
{
    let text = document.getElementById(`makeCommentNav${postId}${modal}`).value;

    $.ajax({
        url: `/comment/${postId}`,
        type: 'POST',
        data:{
            text: text,
        },
        success: function()
        {
            $.ajax({
                url: `/get-post/${postId}`,
                type: 'GET',
                success: function(data)
                {
                    displayDataNav([data], true, true, `${modal}`)
                },
                error: function(error)
                {
                    console.error(error);
                }
            });
        },
        error: function(error)
        {
            console.error("error" + error);
        }
    });
}

function replyOnCommentNav(postId, commentId, replyID, modal)
{
    let text;

    text = document.getElementById(`${replyID}Text${modal}`).value;

    $.ajax({
        url: `/comment/${postId}/${commentId}`,
        type: 'POST',
        data:{
            text: text,
        },
        success: function()
        {
            $.ajax({
                url: `/get-post/${postId}`,
                type: 'GET',
                success: function(data)
                {
                    displayDataNav([data], true, true, `${modal}`)
                },
                error: function(error)
                {
                    console.error(error);
                }
            });
        },
        error: function(error)
        {
            console.error("error" + error);
        }
    });
}

function likeOrUnlikeReplyNav(postId, commentId, replyID, modal)
{
    $.ajax({
        url: `/like-reply/${postId}/${commentId}/${replyID}`,
        type: 'POST',
        success: function(data)
        {
            document.getElementById(`${replyID}Likes${modal}`).innerText = data.length;
        },
        error: function(error)
        {
            console.error(error);
        }
    });
}

function likeOrUnlikePostNav(postId, modal)
{
    $.ajax({
        url: `/like/${postId}`,
        type: 'POST',
        success: function(data)
        {
            document.getElementById(`${postId}Likes${modal}`).innerText = data.length;
        },
        error: function(error)
        {
            console.error(error);
        }
    });
}

function likeOrUnlikeCommentNav(postId, commentID, modal)
{
    $.ajax({
        url: `/like-comment/${postId}/${commentID}/`,
        type: 'POST',
        success: function(data)
        {
            document.getElementById(`${commentID}Likes${modal}`).innerText = data.length;
        },
        error: function(error)
        {
            console.error(error);
        }
    });
}

function deletePostNav(postId, modal)
{
    $.ajax({
        url: `/${postId}`,
        type: 'DELETE',
        success: function()
        {
            document.getElementById(`${postId}${modal}`).style.display = "none";
            document.getElementById(`parent${postId}`).style.display = "none";
            
            if (modal === "modal")
            {
                document.getElementById(`${postId}`).style.display = "none";
            }
        },
        error: function(error)
        {
            console.error(error);
        }
    });
}

function getUserPostsNav(username)
{
    $.ajax({
        url: `/user/${username}`,
        type: 'GET',
        success: function(data)
        {
            if (data.length > 0)
            {
                let user;
                let profileImg;

                if (typeof data[0].user.name !== 'undefined')
                {
                    user = data[0].user.name;

                    if (data[0].user.profileImg !== '' && data[0].user.profileImg !== null && data[0].user.profileImg !== undefined)
                    {
                        profileImg = data[0].user.profileImg;
                    }
                    else
                    {
                        profileImg = getInitials(user);
                    }
                }
                else
                {
                    user = document.getElementById('user').value;
                    profileImg = document.getElementById('img').value;
                }

                if (profileImg.length <= 5)
                {
                    profileImg =
                    `<div style="height: 50px; width: 50px; border-radius: 50%;">${profileImg}</div>`;
                }
                else
                {
                    profileImg =
                    `<img src="${profileImg}" class="currentImgURL square-image" alt="profile Image" />`;
                }

                $('#profileAndUser').html(
                    `<div style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; flex-wrap: nowrap;">
                        <div style="border-radius: 50%; display: flex; height: 75px; width: 75px; justify-content: center; align-items: center; overflow: hidden;">${profileImg}</div>
                        <div style="margin-left: 10px;">${user}</div>
                    </div>`
                );
            }
            
            for (let i = 0; i < data.length; i++)
            {
                $('#userPosts-list').append(createTableRowNav(data[i], false, "modalWidth"));
            }
        },
        error: function(error)
        {
            console.error(error);
        }
    });
    $('#allPosts').modal('show');
}

function submitUpdate()
{
    document.getElementById('buffer').style.display = 'block';

    let email;

    if (document.getElementById('newEmail').value)
    {
        email = document.getElementById('newEmail').value.toLowerCase().trim();
    }
    else
    {
        email = document.getElementById('currentEmail').innerText;
    }

    document.getElementById('email').value = email;

    let formData = new FormData(document.getElementById('profileForm'));

    fetch('/update-user',
    {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data =>
    {
        changeProfile(data);
        document.getElementById('buffer').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
    })
    .catch(error =>
    {
        console.error(error);
    });
}

function changeProfile(data)
{
    console.log(data);
    if (data.profileImg)
    {
        document.getElementById('currentImgURL').src = data.profileImg;
    }
    if (data.email)
    {
        document.getElementById('currentEmail').innerText = data.email;
        document.getElementById('currentEmail').style.display = 'block';
        document.getElementById('editEmail').style.display = 'none';
    }
}
document.addEventListener('DOMContentLoaded', function()
{
    document.getElementById('profileImg').addEventListener('change', function(event)
    {
        const reader = new FileReader();

        reader.onload = function(e)
        {
            // The file's text will be printed here
            document.getElementById('currentImgURL').src = e.target.result;
        };

        // read the file as text
        reader.readAsDataURL(event.target.files[0]);
    });
});

function editEmail()
{
    const currentEmail = document.getElementById('currentEmail');
    const editEmail = document.getElementById('editEmail');
    const submitUpdate = document.getElementById('submit-update');

    if (currentEmail.style.display === 'none')
    {
        currentEmail.style.display = 'block';
        editEmail.style.display = 'none';
        submitUpdate.style.display = 'none';
        document.getElementById('profileWrapper').focus();
    }
    else
    {
        currentEmail.style.display = 'none';
        editEmail.style.display = 'block';
        submitUpdate.style.display = 'block';
        document.getElementById('profileWrapper').removeAttribute('tabindex');
        document.getElementById('newEmail').focus();
        document.getElementById('profileWrapper').focus();
        document.getElementById('profile-dropdown').classList.remove('hide');
    }
}

function newEmailFocusOut()
{
    document.getElementById('profileWrapper').setAttribute('tabindex', -1);
    document.getElementById('profileWrapper').focus();
    document.getElementById('currentEmail').innerText = document.getElementById('newEmail').value;
    editEmail();
    document.getElementById('submit-update').style.display = 'block';
}

function enableButton()
{
    const button = document.getElementById('post-button');
    const input = document.getElementById('postText');

    if (input.value.length > 0)
    {
        button.classList.remove('button-disabled');
        button.classList.add('button-enabled');
    }
    else
    {
        button.classList.add('button-disabled');
        button.classList.remove('button-enabled');
    }
}

function clickComment(postID, modal)
{
    console.log("hey");
    // focuses on comment input
    document.getElementById(`makeCommentNav${postID}${modal}`).focus();
}

function buttonBlue(id, modal)
{
    document.getElementById(`${id}icon${modal}`).style.color = '#1877F2';
}

function buttonBlueOut(id, modal)
{
    document.getElementById(`${id}icon${modal}`).style.color = '#333333';
}

function notificationsActive(element)
{
    document.getElementsByClassName('notification-buttons')[0].classList.remove('notification-active');
    document.getElementsByClassName('notification-buttons')[1].classList.remove('notification-active');
    
    if (element === 0) // all notifications
    {
        $.ajax({
            url: '/topNavNotifications/all',
            type: 'GET',
            success: function(data)
            {
                document.getElementsByClassName('notification-buttons')[0].classList.add('notification-active');
                document.getElementsByClassName('notification-buttons')[1].classList.remove('notification-active');
                document.getElementById('notifications').innerHTML = data;
            },
            error: function(error)
            {
                console.error('Error:', error);
            }
        });
    }
    else // unread notifications
    {
        $.ajax({
            url: '/topNavNotifications/unread',
            type: 'GET',
            success: function(data)
            {
                document.getElementsByClassName('notification-buttons')[1].classList.add('notification-active');
                document.getElementsByClassName('notification-buttons')[0].classList.remove('notification-active');
                document.getElementById('notifications').innerHTML = data;
            },
            error: function(error)
            {
                console.error('Error:', error);
            }
        });
    }
}

function markAsRead(notificationID, clickedElement, id)
{
    let notificationCount = 1;

    if (notificationID.includes(','))
    {
        let notificationArray = notificationID.split(',');
        notificationCount = notificationArray.length;
    }

    $.ajax({
        url: '/mark-notification-read',
        type: 'POST',
        data: {
            _id: notificationID
        },
        success: function()
        {
            if (parseInt(document.getElementById('notification-counter').innerText) > 1)
            {
                document.getElementById('notification-counter').innerText = parseInt(document.getElementById('notification-counter').innerText) - notificationCount;
            }
            else
            {
                document.getElementById('notification-counter').style.display = 'none';
            }

            clickedElement.classList.remove('unread');
            clickedElement.classList.add('read');

            document.getElementById(`notificationIcon${id}`).style.display = 'none';

            document.getElementById('notificationsWrapper').setAttribute('tabindex', -1);
            document.getElementById('notificationsWrapper').focus();
            document.getElementById('notifications-dropdown').classList.remove('hide');
        },
        error: function(error)
        {
            console.error('Error:', error);
        }
    });
}

function displaySearchResults()
{
    const searchInput = document.getElementById('videoSearch').value;

    if (searchInput !== '') {
        $.ajax({
            url: `/search-videos/${searchInput}`,
            type: 'GET',
            contentType: 'application/json',
            success: function(response)
            {
                console.log(response)

                const dropdown = $('#searchResultsDropdown');
                dropdown.empty(); // Clear previous results

                if (response.length > 0)
                {
                    response.forEach(result =>
                    {
                        const item = $('<div></div>').css({
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }).on('click', function() {
                            location.href = `./course?module=${result.module}`;
                        });
                    
                        const thumbnail = $('<img>').attr('src', result.thumbnail).css({
                            width: '80px',
                            height: 'auto',
                            marginRight: '8px'
                        });
                    
                        const text = $('<span></span>').text(result.title);
                    
                        item.append(thumbnail);
                        item.append(text);
                        dropdown.append(item);
                    });
                    $('#searchWrapper').focus();
                } 
                else
                {
                    dropdown.hide();
                }
            },
            error: function(error)
            {
                console.error('Error:', error);
            }
        });
    }
}

function searchInputDisplay()
{
    const searchButton = document.getElementsByClassName('desktop-search-button')[0];
    if (searchButton.style.display === 'flex')
    {
        searchButton.style.display = 'none';
    }
    else
    {
        searchButton.style.display = 'flex';
    }
}
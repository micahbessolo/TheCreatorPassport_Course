const userCollection = require('./models/user-collection');
const notificationsCollection = require('./models/notification-collection');

async function topNav(req)
{
    const page = req.params.page;
    const id = req.user._conditions._id;
    const userName = await getUserNameById(id);
    let breadCrumb;
    let profileImg = await getProfileImgById(id);
    let profileImg2 = '';
    let email = await getEmailById(id);

    switch (page)
    {
        case 'dashboard':
            breadCrumb = 
            `<div style="color: #649399; text-decoration: underline !important;">Dashboard</div>`;
            break;
        case 'favorites':
            breadCrumb =
            `<div style="display: flex; flex-direction: row; justify-content: flex-start; flex-wrap: nowrap;">
                <div><a class="dashboard-link" style="color: #FFFFFF;" href="/">Dashboard</a></div>
                <div class="adjustable-padding" style="color: white;"><i class="fa-solid fa-chevron-right"></i></div>
                <div style="color: #649399; text-decoration: underline !important;">Favorites</div>
            </div>`;
            break;
        case 'community':
            breadCrumb =
            `<div style="display: flex; flex-direction: row; justify-content: flex-start; flex-wrap: nowrap;">
                <div><a class="dashboard-link" style="color: #FFFFFF;" href="/">Dashboard</a></div>
                <div class="adjustable-padding" style="color: white;"><i class="fa-solid fa-chevron-right"></i></div>
                <div id="tracks" style="color: #649399; text-decoration: underline !important;">Community</div>
            </div>`;
            break;
        case 'live-trainings':
            breadCrumb =
            `<div style="display: flex; flex-direction: row; justify-content: flex-start; flex-wrap: nowrap;">
                <div><a class="dashboard-link" style="color: #FFFFFF;" href="/">Dashboard</a></div>
                <div class="adjustable-padding" style="color: white;"><i class="fa-solid fa-chevron-right"></i></div>
                <div style="color: #649399; text-decoration: underline !important;">Live Trainings</div>
            </div>`;
            break;
        case 'track-1':
            breadCrumb =
            `<div style="display: flex; flex-direction: row; justify-content: flex-start; flex-wrap: nowrap;">
                <div><a class="dashboard-link" style="color: #FFFFFF;" href="/">Dashboard</a></div>
                <div class="adjustable-padding" style="color: white;"><i class="fa-solid fa-chevron-right"></i></div>
                <div id="tracks" style="color: #649399; text-decoration: underline !important;">Track 1</div>
            </div>`;
            break;
        case 'track-2':
            breadCrumb =
            `<div style="display: flex; flex-direction: row; justify-content: flex-start; flex-wrap: nowrap;">
                <div><a class="dashboard-link" style="color: #FFFFFF;" href="/">Dashboard</a></div>
                <div class="adjustable-padding" style="color: white;"><i class="fa-solid fa-chevron-right"></i></div>
                <div id="tracks" style="color: #649399; text-decoration: underline !important;">Track 2</div>
            </div>`;
            break;
        case 'track-3':
            breadCrumb =
            `<div style="display: flex; flex-direction: row; justify-content: flex-start; flex-wrap: nowrap;">
                <div><a class="dashboard-link" style="color: #FFFFFF;" href="/">Dashboard</a></div>
                <div class="adjustable-padding" style="color: white;"><i class="fa-solid fa-chevron-right"></i></div>
                <div id="tracks" style="color: #649399; text-decoration: underline !important;">Track 3</div>
            </div>`;
            break;
        case 'course':
            breadCrumb =
            `<div style="display: flex; flex-direction: row; justify-content: flex-start; flex-wrap: nowrap;">
                <div class="adjustable-text"><a class="dashboard-link" style="color: #FFFFFF;" href="/">Dashboard</a></div>
                <div class="adjustable-padding" style="color: white;"><i class="fa-solid fa-chevron-right"></i></div>
                <div class="adjustable-text"><a class="dashboard-link" style="color: #FFFFFF;" href="" id="tracks">Track</a></div>
                <div class="adjustable-padding" style="color: white;"><i class="fa-solid fa-chevron-right"></i></div>
                <div class="adjustable-text" style="color: #649399; text-decoration: underline !important;">Course</div>
            </div>`;
            break;
        case 'admin':
            breadCrumb =
            `<div style="display: flex; flex-direction: row; justify-content: flex-start; flex-wrap: nowrap;">
                <div><a class="dashboard-link" style="color: #FFFFFF;" href="/">Dashboard</a></div>
                <div class="adjustable-padding" style="color: white;"><i class="fa-solid fa-chevron-right"></i></div>
                <div id="tracks" style="color: #649399; text-decoration: underline !important;">Admin</div>
            </div>`;
            break;
    }

    if (profileImg)
    {
        profileImg2 = 
        `<div class="topNavbuttons" style="height: 40px; width: 40px; display: flex; justify-content: center; align-items: center; overflow: hidden; border-radius: 50%;" >
            <img src="${profileImg}" style="height: auto; width: 100%; object-fit: contain; border-radius: 50%; min-height: 40px;" alt="profile Image"/>
        </div>`;

        profileImg = 
        `<div style="height: 150px; width: 150px; display: flex; justify-content: center; align-items: center; overflow: hidden; border-radius: 50%;">
            <img src="${profileImg}" id="currentImgURL" class="currentImgURL square-image" alt="profile Image" style="height: 100%; object-fit: contain; width: auto; min-height: 50px;" />
        </div>`;
    }
    else
    {
        profileImg2 =
        `<div style="width: 40px;" class="topNavbuttons">
            <div class="placeholder-profile" style="height: 40px; width: 40px; border-radius: 50%; background: #F0F2F5; display: flex; justify-content: center; align-items: center;">
                <i class="fa-solid fa-user" style="font-size: 1.2rem;"></i>
            </div>
        </div>`;
        profileImg = `<div style="color: black;">Add profile pic</div>`;
    }

    const unreadNotificationsLength = (await getNotifications(id, true)).length;
    let notificationCounterSpan = '';

    if (unreadNotificationsLength !== 0)
    {
        notificationCounterSpan =
        `<span id="notification-counter" class="topNavbuttons" style="position: absolute; top: -9px; right: -9px; padding: 2px 5px; background-color: red; color: white; border-radius: 50%; font-size: 0.8rem;">${unreadNotificationsLength}</span>`;
    }

    const notificationsList = await notificationsContent(id, true);
    
    const htmlContent =
    `<link rel="stylesheet" type="text/css" href="./assets/CSS/topnav.css" />
    <input class="hide" id="currentUser" value="${userName}" />

    <div class="topNav">
        ${breadCrumb}
        <div class="topnav-right-wrapper">
            
            <div class="mobile-search-button noStyle">
                <button class="noStyle" type="button" onclick="searchInputDisplay();">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </button>
            </div>

            <div id="searchWrapper" class="desktop-search-button" onFocus="showSearchResults()" onfocusout="hideSearchResults();" tabindex="-1">
                <div class="input-group desktop-search-input-wrapper">
                    <input type="text" class="form-control desktop-search-input" id="videoSearch" placeholder="search video"
                    onkeydown="if (event.key === 'Enter') displaySearchResults();" />
                    <button class="noStyle input-group-append" type="button" onclick="displaySearchResults();">
                        <i class="fa-solid fa-magnifying-glass" id="videoSearchButton"></i>
                    </button>
                </div>
                <div id="searchResultsDropdown" class="dropdown-content hide">

                </div>
            </div>


            <div id="notificationsWrapper" style="color: white; margin-top: 4px; position: relative;" onFocus="showNotifications()" onfocusout="hideNotifications();" tabindex="-1">
                <i class="fa-regular fa-bell topNavbuttons" style="font-size: 1.6rem;"></i>
                ${notificationCounterSpan}
               
                <div id="notifications-dropdown" class="hide" style="position: absolute; width: 350px; height: fit-content; max-height: calc(100vh - 70px); top: 60px; right: 0; background-color: #FFFFFF; z-index: 2; display: flex; flex-direction: column; align-items: center; padding: 20px 0 20px 0; border-radius: 10px; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1); overflow-y: auto;">
                    <div style="display: flex; flex-direction: row; justify-content: flex-start; width: 100%; font-size: 24px; font-weight: bold; padding-left: 20px; padding-bottom: 10px; color: black;">Notifications</div>
                    <div style="display: flex; flex-direction: row; justify-content: flex-start; width: 100%; padding-left: 20px; padding-bottom: 10px;">
                        <div style="margin-right: 10px;">
                            <div onclick="notificationsActive(0)" class="notification-buttons notification-active topNavbuttons">All</div>
                        </div>
                        <div>
                            <div onclick="notificationsActive(1)" class="notification-buttons topNavbuttons">Unread</div>
                        </div>
                    </div>
                    <div id="notifications" style="width: 100%; overflow: auto;">
                        ${notificationsList}
                    </div>
                </div>
            </div>

            <div id="profileWrapper" style="color: white; margin-top: 4px; position: relative;" onFocus="showProfile()" onfocusout="hideProfile();" tabindex="-1">
                ${profileImg2}

                <div id="profile-dropdown" class="hide" style="position: absolute; width: 300px; height: fit-content; top: 60px; right: 10px; background-color: #FFFFFF; z-index: 2; display: flex; flex-direction: column; align-items: center; padding: 20px; border-radius: 10px; box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);">
                    <div style="width: 150px; height: 150px; background-color: #FFFFFF; border-radius: 50%; border: 1px solid black; display: flex; justify-content: center; align-items: center;">
                        <div id="currentProfileImg" style="height: 100%; width: 100%; display: flex; justify-content: center; align-items: center; overflow: hidden; border-radius: 50%;">
                            ${profileImg}
                        </div>
                    </div>
                    <div class="topNavbuttons" style="position: absolute; top: 50px; right: 50px;" onclick="document.getElementById('profileImg').click(); document.getElementById('submit-update').style.display = 'block';">
                        <svg stroke="#53adcb" fill="#53adcb" stroke-width="0" viewBox="0 0 24 24" class="w-4 h-4 text-white" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                    </div>
                    <div style="display: flex; flex-direction: row; justify-content: space-evenly; padding-top: 20px; width: 100%;">
                        <div id="currentEmail" style="color: black;">
                            ${email}
                        </div>
                        <div style="display: none; width: calc(100% - 30px);" id="editEmail">
                            <input id="newEmail" onchange="document.getElementById('submit-update').style.display = 'block'; " onFocusOut="newEmailFocusOut();" style="width: 100%; height: auto; object-fit: none;" type="text" value="${email}" />
                        </div>
                        <div>
                            <div class="topNavbuttons" onclick="editEmail();">
                                <svg stroke="#53adcb" fill="#53adcb" stroke-width="0" viewBox="0 0 24 24" class="w-4 h-4 text-white" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div style="display: none; margin-top: 20px;" id="submit-update">
                        <div class="topNavbuttons" onclick="submitUpdate();" style="background: #53adcb; color: #FFFFFF; width: 100px; height: 30px; border-radius: 7px; text-align: center; padding-top: 2px;">Update</div>
                    </div>
                    <div style="margin-top: 12px;">
                        <form action="/logout?_method=DELETE" id="logout" method="POST" onsubmit="updateRememberMe();">
                            <div class="topNavbuttons" onclick="document.getElementById('logout').submit();" style="color: black;">Log Out</div>
                        </form>
                    </div>
                    <div id="buffer" style="display: none;"><img src="./assets/images/loading-buffering.gif" style="width: 50px; height: 50px;" /></div>
                    <div id="success-message" style="display: none; padding-top: 10px; color: black;">Updated successfully!</div>
            
                    <div style="display: none;">
                        <form id="profileForm" action="/update-user" enctype="multipart/form-data" method="POST">
                            <input type='file' id="profileImg" name="profileImg" accept='image/*' autocomplete="off" />
                            <input id="email" name="email" autocomplete="off" />
                        </form>
                    </div>
                </div>
            </div>
            
        </div>
    </div>`;
    
    return htmlContent;
}

async function topNavNotifications(req)
{
    const type = req.params.type;
    const id = req.user._conditions._id;
    let notifications;

    if (type === 'all')
    {
        notifications = await notificationsContent(id, true);
    }
    else
    {
        notifications = await notificationsContent(id);
    }

    return notifications;
}

async function markNotificationRead(req)
{
    try
    {
        const id = req.user._conditions._id;
    
        if (req.body._id.includes(','))
        {
            reqArray = req.body._id.split(',');

            for (let i = 0; i < reqArray.length; i++)
            {
                let notification = await notificationsCollection.find({ to: id, _id: reqArray[i] });
                notification = notification[0];
                notification.read = true;
                notification = await notification.save();
            }
        }
        else
        {
            let notification = await notificationsCollection.find({ to: id, _id: req.body._id });
            notification = notification[0];
            notification.read = true;
            notification = await notification.save();
        }
    
        return 'Success';
    }
    catch (error)
    {
        console.error(error);
        return 'Internal server error';
    }
}

async function getUserNameById(id)
{
    try 
    {
        const user = await userCollection.findOne({ _id: id });
        if (!user)
        {
            return 'User not found';
        }

        return user.name;
    } 
    catch (error)
    {
        console.error('Error getting user name:', error);
        return 'Internal server error';
    }
}

async function getEmailById(id)
{
    try 
    {
        const user = await userCollection.findOne({ _id: id });
        if (!user)
        {
            return 'User not found';
        }

        return user.email;
    } 
    catch (error)
    {
        console.error('Error getting user email:', error);
        return 'Internal server error';
    }
}

async function getProfileImgById(id)
{
    try 
    {
        const user = await userCollection.findOne({ _id: id });
        if (!user)
        {
            return 'User not found';
        }

        return user.profileImg;
    } 
    catch (error)
    {
        console.error('Error getting user profileImg:', error);
        return 'Internal server error';
    }
}

async function getNotifications(userId, filterForUnread = false)
{
    try
    {
        let notifications;
        if (!filterForUnread)
        {
            notifications = await notificationsCollection.find({ to: userId }).sort({ createdAt: -1 }).limit(50);
        }
        else
        {
            notifications = await notificationsCollection.find({ to: userId, read: false }).sort({ createdAt: -1 }).limit(50);
        }
        
        let updatedNotifications = [];

        for (let notification of notifications)
        {
            try
            {
                const fromName = await getUserNameById(notification.from);
                const profileImg = await getProfileImgById(notification.from);
                updatedNotifications.push({ ...notification._doc, fromName, profileImg });
            }
            catch (error)
            {
                console.error('Error:', error);
            }
        }
        return updatedNotifications;        
    }
    catch (error)
    {
        console.error('Error getting notifications:', error);
        return 'Internal server error';
    }
}

async function notificationsContent(id, allNotifications)
{
    let notifications;

    if (allNotifications)
    {
        notifications = await getNotifications(id);
    }
    else
    {
        notifications = await getNotifications(id, true);
    }

    let updatedNotifications = notifications.reduce((acc, notification) =>
    {
        let key = `${notification.post}-${notification.type}-${notification.read}`;
        if (!acc[key])
        {
            acc[key] = [];
        }
        acc[key].push(notification);
        return acc;
    }, {});

    updatedNotifications = Object.values(updatedNotifications);

    let notificationsList = ''; // becomes the html content for the notifications dropdown

    for (let i = 0; i < updatedNotifications.length; i++)
    {
        if (updatedNotifications[i].length > 1)
        {
            let notificationType;

            if (updatedNotifications[i][0].type === 'like')
            {
                if (updatedNotifications[i][0].length === 2)
                {
                    notificationType = `and ${updatedNotifications[i].length - 1} other liked your post`;
                }
                else if (updatedNotifications[i][0].length > 2)
                {
                    notificationType = `and ${updatedNotifications[i].length - 1} others liked your post`;
                }
                else
                {
                    console.log('Error: Notification type not found');
                }
            }
            else if (updatedNotifications[i][0].type === 'comment')
            {
                if (updatedNotifications[i].length === 1)
                {
                    notificationType = 'commented on your post';
                }
                else if (updatedNotifications[i].length === 2)
                {
                    notificationType = `and ${updatedNotifications[i].length - 1} other commented on your post`;
                }
                else if (updatedNotifications[i].length > 2)
                {
                    notificationType = `and ${updatedNotifications[i].length - 1} others commented on your post`;
                }
                else
                {
                    console.log('Error: Notification type not found');
                }
            }
            else if (updatedNotifications[i][0].type === 'like comment')
            {
                if (updatedNotifications[i].length === 1)
                {
                    notificationType = 'liked your comment';
                }
                else if (updatedNotifications[i].length === 2)
                {
                    notificationType = `and ${updatedNotifications[i].length - 1} other liked your comment`;
                }
                else if (updatedNotifications[i].length > 2)
                {
                    notificationType = `and ${updatedNotifications[i].length - 1} others liked your comment`;
                }
                else
                {
                    console.log('Error: Notification type not found');
                }
            }

            let notificationPostArray = [];

            for (let j = 0; j < updatedNotifications[i].length; j++)
            {
                notificationPostArray.push(updatedNotifications[i][j]._id.toString());
            }

            if (!updatedNotifications[i][0].read)
            {
                notificationsList +=
                `<div onclick="getNotificationPost('${updatedNotifications[i][0].post}'); markAsRead('${notificationPostArray}', this, '${updatedNotifications[i][0].post}');" class="notification noStyle unread">
                    ${await userProfileImageNav(updatedNotifications[i][0])}
                    <div style="padding: 0 7px 7px 7px; width: 250px; text-align: start;">
                        <div><b>${updatedNotifications[i][0].fromName}</b> ${notificationType}</div>
                        <div style="color: #1877F2;">${formatDate(updatedNotifications[i][0].createdAt)}</div>
                    </div>
                    <div style="width: 30px; text-align: start;"><i id="notificationIcon${updatedNotifications[i][0].post}" class="fa-solid fa-circle" style="color: #1877F2; font-size: .75rem; text-align: start;"></i></div>
                </div>`;
            }
            else
            {
                notificationsList +=
                `<div onclick="getNotificationPost('${updatedNotifications[i][0].post}');" class="notification noStyle read">
                    ${await userProfileImageNav(updatedNotifications[i][0])}
                    <div style="padding: 0 7px 7px 7px; width: 250px; text-align: start;">
                        <div><b>${updatedNotifications[i][0].fromName}</b> ${notificationType}</div>
                        <div style="color: #1877F2;">${formatDate(updatedNotifications[i][0].createdAt)}</div>
                    </div>
                    <div style="width: 30px; text-align: start;"></div>
                </div>`;
            }
        }
        else
        {
            let notificationType;

            if (updatedNotifications[i][0].type === 'like')
            {
                notificationType = 'liked your post';
            }
            else if (updatedNotifications[i][0].type === 'comment')
            {
                notificationType = 'commented on your post';
            }
            else if (updatedNotifications[i][0].type === 'like comment')
            {
                notificationType = 'liked your comment';
            }

            if (!updatedNotifications[i][0].read)
            {
                notificationsList +=
                `<div onclick="getNotificationPost('${updatedNotifications[i][0].post}'); markAsRead('${updatedNotifications[i][0]._id}', this, '${updatedNotifications[i][0].post}');" class="notification noStyle unread">
                    ${await userProfileImageNav(updatedNotifications[i][0])}
                    <div style="padding: 0 7px 7px 7px; width: 250px; text-align: start;">
                        <div><b>${updatedNotifications[i][0].fromName}</b> ${notificationType}</div>
                        <div style="color: #1877F2;">${formatDate(updatedNotifications[i][0].createdAt)}</div>
                    </div>
                    <div style="width: 30px; text-align: start;">
                        <i id="notificationIcon${updatedNotifications[i][0].post}" class="fa-solid fa-circle" style="color: #1877F2; font-size: .75rem; text-align: start;"></i>
                    </div>
                </div>`;
            }
            else
            {
                notificationsList +=
                `<div onclick="getNotificationPost('${updatedNotifications[i][0].post}');" class="notification noStyle read">
                    ${await userProfileImageNav(updatedNotifications[i][0])}
                    <div style="padding: 0 7px 7px 7px; width: 250px; text-align: start;">
                        <div><b>${updatedNotifications[i][0].fromName}</b> ${notificationType}</div>
                        <div style="color: #1877F2;">${formatDate(updatedNotifications[i][0].createdAt)}</div>
                    </div>
                    <div style="width: 30px;"></div>
                </div>`;
            }
        }
    }
    return notificationsList;
}

async function userProfileImageNav(notification)
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
        `<div style="width: 50px;">
            <div class="placeholder-profile" style="height: 50px; width: 50px; border-radius: 50%; background: #F0F2F5; display: flex; justify-content: center; align-items: center;">
                <i class="fa-solid fa-user" style="font-size: 1.2rem;"></i>
            </div>
        </div>`;
    }
    else
    {
        profileImg =
        `<div style="height: 50px; width: 50px; display: flex; justify-content: center; align-items: center; overflow: hidden; border-radius: 50%;" >
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

module.exports = {
    topNav,
    topNavNotifications,
    markNotificationRead
};
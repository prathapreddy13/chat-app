const socket=io();
const $messageForm=document.querySelector('#message-form');
const $messageFormInput=$messageForm.querySelector('input');
const $messageFormButton=$messageForm.querySelector('button');
const $messages=document.querySelector('#messages');
const messageTemplete=document.querySelector('#message-templete').innerHTML;
const locationMessageTemplete=document.querySelector('#location-message-templete').innerHTML
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})
const sidebarTemplete=document.querySelector('#sidebar-templete').innerHTML
const autoScroll=()=>{
    const $newMessage=$messages.lastElementChild
    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight+newMessageMargin
    const visibleHeight=$messages.offsetHeight
    const containerHeight=$messages.scrollHeight
    const scrollOffset=$messages.scrollTop+visibleHeight
    if(containerHeight-newMessageHeight<=scrollOffset){
        $messages.scrollTop=$messages.scrollHeight
    }
}
socket.on('printMessage',(result)=>{
    console.log(result);
    const html=Mustache.render(messageTemplete,{
        message:result.text,
        user:result.username,
        time:moment(result.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll();
})
socket.on('printLocationMessage',(result)=>{
    console.log(result);
    const html=Mustache.render(locationMessageTemplete,{
        url:result.url,
        user:result.username,
        time:moment(result.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html);
    autoScroll()
})
socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplete,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})
$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    $messageFormButton.setAttribute('disabled','disabled')
    const message=e.target.elements.message.value;
    socket.emit('sendMessage',message,(error)=>{
        $messageFormInput.value='';
        $messageFormButton.removeAttribute('disabled');
        if(error){
            return console.log(error);
        }
        console.log('Delivered!');
    });
})
const $locationbutton=document.querySelector('#send-location');

$locationbutton.addEventListener('click',()=>{
    $locationbutton.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position)=>{
        socket.emit('sendLocation',{
            latitude:position.coords.latitude,
            longitude:position.coords.longitude
        },()=>{
            $locationbutton.removeAttribute('disabled');
            console.log('Location Shared!');
        })
    })
})
socket.emit('join',{username,room},(error)=>{
    if(error)
    {
        alert(error);
        location.href='/'
    }

});
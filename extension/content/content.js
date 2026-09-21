console.log("Meeting AI content script loaded");

const message = document.createElement("div");

message.textContent = "Meeting AI Extension Active";

message.style.position = "fixed";
message.style.top = "10px";
message.style.right = "10px";
message.style.zIndex = "999999";
message.style.background = "white";
message.style.padding = "10px";
message.style.border = "1px solid black";

document.body.appendChild(message);
if (!window.console.log) {
    window.console.log = function() { };
}

/*
 * Parameters:
 *      url:      URL to send messages to
 *      on_recv:  event handler for push data [proto: f(title, lines)]
 */
function ChatService(opt) {
    this.opt = opt;
    this.ws = null;
    this.pending = [];
    this.is_connected = false;
    this.reconnect = setInterval(this.connect.bind(this), 1000);
}

ChatService.prototype.connect = function() {
    if (!this.is_connected) {
        console.log('Connecting to ' + this.opt.url);
        this.ws = new WebSocket(this.opt.url);
        this.ws.onopen    = this.on_connect.bind(this);
        this.ws.onclose   = this.on_close.bind(this);
        this.ws.onmessage = this.on_recv.bind(this);
    } else {
        console.log('...');
    }
};

ChatService.prototype.on_connect = function(e) {
    console.log('Connected to ' + this.opt.url);
    this.is_connected = true;

    while (this.pending.length > 0) {
        this.send(this.pending.shift());
    }
};

ChatService.prototype.on_close = function(e) {
    console.log('Disconnected from ' + this.opt.url);
    this.is_connected = false;
    this.ws = null;
};

ChatService.prototype.on_recv = function(e) {
    var response = JSON.parse(e.data);
    this.opt.on_recv(response.title, response.lines);
};

ChatService.prototype.send = function(msg) {
    console.log('Send: ' + msg);
    this.ws.send(msg);
};

ChatService.prototype.queue = function(msg) {
    if (this.is_connected) {
        this.send(msg);
    } else {
        console.log('Queue: ' + msg);
        this.pending.push(msg);
        this.connect();
    }
};

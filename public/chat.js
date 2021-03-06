function ChatService(opt) {
    this.opt = opt;

    ['name', 'url', 'set_topic', 'set_users', 'add_msgs', 'on_error'].each(
        function(key) {
            if (!Object.has(opt, key))
                throw("opt." + key + " not set");
        }
    );

    this.ws = null;
    this.pending = [];
    this.is_connected = false;
    this.connect.bind(this).every(1500);
    this.initialized = false;
}

ChatService.prototype.connect = function() {
    if (!this.is_connected) {
        try {
            this.ws = new WebSocket(this.opt.url);
        } catch (e) {
            this.connect.cancel();
            this.opt.on_error(e);
        }

        this.ws.onopen    = this.on_connect.bind(this);
        this.ws.onclose   = this.on_close.bind(this);
        this.ws.onmessage = this.recv.bind(this);
    }
};

ChatService.prototype.on_connect = function(e) {
    this.is_connected = true;

    this.pending.each(this.send.bind(this));
    this.pending = [];

    if (!this.initialized) {
        this.initialized = true;
        if (Object.has(this.opt, 'on_ready')) {
            this.opt.on_ready();
        }
    }
};

ChatService.prototype.on_close = function(e) {
    this.is_connected = false;
    this.ws = null;
};

ChatService.prototype.recv = function(e) {
    var response = JSON.parse(e.data);

    if (response.error) {
        alert(response.error);
        return;
    }

    if (response.topic) {
        this.opt.set_topic(response.topic);
    }

    if (response.users) {
        this.opt.set_users(response.users);
    }

    if (response.msgs) {
        this.opt.add_msgs(response.msgs);
    }
};

ChatService.prototype.send = function(data) {
    this.ws.send(JSON.stringify(data));
};

ChatService.prototype.queue = function(msg, target) {
    msg = msg.trim();
    if (msg !== '') {
        var data = { 'msg': msg, 'target': target };
        if (this.is_connected) {
            this.send(data);
        } else {
            this.pending.push(data);
        }
    }
};


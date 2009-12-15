
var posix = require('posix');
var sys = require('sys');
var server;
var child_js_file = process.ARGV[2];
var current_dir = __filename.split('/');
current_dir = current_dir.slice(0, current_dir.length-1).join('/');

var start_server = function(){
    server = process.createChildProcess('node', [child_js_file]);
    var pass_along = function(data){
        if (data !== null) sys.print(data);
    };
    server.addListener('output', pass_along);
    server.addListener('error', pass_along);
    sys.puts('server started');
};

var restart_server = function(){
    sys.puts('change discovered, restarting server');
    server.close();
    setTimeout(start_server, 500);
};

var parse_file_list = function(dir, files){
    for (var i=0;i<files.length;i++){
        (function(){
            var file = dir+'/'+files[i];
            posix.stat(file).addCallback(function(stats){
                if (stats.isDirectory())
                    posix.readdir(file).addCallback(function(files){
                        parse_file_list(file, files);
                    });
                else if (stats.isFile())
                    process.watchFile(file, restart_server);
            });
        })();
    }
};

posix.readdir(current_dir).addCallback(function(files){
    parse_file_list(current_dir, files);
});

start_server();


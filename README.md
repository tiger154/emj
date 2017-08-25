# Emj
Emj is a jQuery lib for emoji. It convert a div to simple wizig editor. Easy to use 


## How to use

```
 // Simple as you can see
 $('.emoji1').emj({
    theme: 'emojione'
});
```

## Configulation 

```
  $.fn.emj.defaults = {
          theme: 'emojione' // main theme you want to use
         ,enterToBr: true // (bool) when user type enter it replace to <br><br>
         ,afterInit: function() {  // closure call back, It run after finish all init of the plugin
            return true;
         }
         , themes: {   // all themes you can manage here whatever you want easy to manage it 
            emojione: {
             "name" : "emojione",
             "version": "3.1.0",
             "size": "32",
             "imgPath": "https://cdnjs.cloudflare.com/ajax/libs/emojione/2.2.7/assets/png/"
             // It support even local path: /images/emoji/emojione/3.1.0/png/32/
            },
            twemoji: {
             "name" : "twemoji",
             "version": "2.3",
             "size": "32",
             "imgPath": "https://abs.twimg.com/emoji/v2/72x72/" // https://abs.twimg.com/emoji/v2/72x72/
            },
            custom_theme: {
             "name" : "custom_theme", // emojione, twemoji, etc...
             "version": "1.0",
             "size": "32",
             "imgPath": "/some/image/path/for/custom_theme/" 
            }
         }
         , pickerPosition : 'right' // now it support right/top only 
         , customEmoji:[   // You can add any kind of custom Emoji here and can call it. 
           {
            name: ":custom_icon:",
            src: "/images/default_profile_icon_35x35.jpg"
           },					{
            name: ":custom_demo2:",
            src: "/images/emoji/emojione/3.1.0/png/32/1f46c.png"
           },					{
            name: ":customz_demo3:",
            src: "/images/emoji/emojione/3.1.0/png/32/1f46d.png"
           }
          ]
          , filters: {
            // customize filters & emoji buttons           
          } 
  }        
```

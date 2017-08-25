# Emj
Emj is a jQuery lib for emoji. It convert a div to simple wizig editor.
It support theme such as emojione, twemoji and even you can set your own theme

You want to see realtime demo? https://jsfiddle.net/75hkejpr/ 

## Screen shot how it works 
As you can see it's clear we can see totally diffrent theme as well here
<img src='https://user-images.githubusercontent.com/2743415/29703976-c7e7b070-89b2-11e7-88e7-8b48e719cc31.png'>

## How to use

```
 // Simple as you can see
 $('.emoji1').emj({
    theme: 'emojione'
});
```

## Main diff between other lib of emoji
```
 1) Theme 
  - You can set entire diff theme 
  - You can controll each tab(filters) 
 2) Custom emoji 
  - You can set your own emoji so easy
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

## Dependency
```
  A) Jquery 2.1.4
  B) Jquery UI 1.10.2
  C) emojione.js(v 3.1)
     - https://github.com/emojione/emojione
  D) Underscore 1.8.3

```

## RoadMap
```
  1) Support textarea field
  2) Support input field
  3) Fix not support image between twemoji and emojione(need to check all unicode diff) 
  4) Support other position(left, bottom)
  5) Emoji search by typing start with ':'

```

## Referrence
- Thank you for all great lib contributers 

  1) emojione: https://github.com/emojione/emojione
  2) twemoji: https://github.com/mervick/emojionearea
  3) emojionearea: https://github.com/mervick/emojionearea 



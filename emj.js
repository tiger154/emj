/*!
 * Emj v1.0.0
 * Copyright Jeonhwan
 * Released under the MIT license
 * Date: 2017-07-27
 *
 * 1. Dependency
 *    A) Jquery 2.1.4
 *    B) Jquery UI 1.10.2
 *    C) emojione.js(/js/emoji/emojione.js): https://github.com/emojione/emojione
 *    D) Underscore: 
 */
(function( $, emojione) {

    // definition of plugin
    $.fn.emj = function(options) {

		/////////////////////////
		//      Vars           //
		/////////////////////////

		var invisibleChar = '&#8203;';
		// template Base(It use underscore(_) lib template)
		var tmpBase = '';
			tmpBase += '<div class="emj-container">';
			tmpBase += '	<div class="emj-editor-dummy"></div>';
			tmpBase += '	<div class="emj-btn-box">';
			tmpBase += '		<div class="emj-btn emj-btn-open"></div>';
			tmpBase += '		<div class="emj-btn emj-btn-close"></div>';
			tmpBase += '	</div>';
			tmpBase += '	<div class="emj-picker emj-picker-position-<%= rc.opts.pickerPosition %>" style="display:none">';
			tmpBase += '		<div class="emj-picker-wrapper">';
			tmpBase += '			<div class="emj-tab-box">';
			tmpBase += '				<% var i = 0; %>'; 
			tmpBase += '				<% _.each( rc.opts.filters, function( filter, key ){ %>';
			tmpBase += '					<i class="emj-tab emj-tab-<%= key %> <% if(i==0){ %> active <% } %>" data-tab="<%= key %>" title="<%= filter.title %>">';
			tmpBase += '						<%= rc.emj.shornameToImage(":"+ filter.icon +":",false,false) %>';
			tmpBase += '					</i>';
			tmpBase += '				<% i++; %>';
			tmpBase += '				<% }); %>';
			tmpBase += '			</div>';
			tmpBase += '			<div class="emj-scroll-area">';
			tmpBase += '				<div class="emj-list">';
			tmpBase += '					<% _.each( rc.opts.filters, function( filter, ckey ){ %>';
			tmpBase += '						<div class="emj-category emj-ct-<%= ckey %>" data-category="<%= ckey %>">';
			tmpBase += '							<h1><%= filter.title %></h1>';
			tmpBase += '								<%= rc.emj.loadImj(ckey, filter) %>';
			tmpBase += '						</div>';
			tmpBase += '					<% }); %>';
			tmpBase += '				</div>';
			tmpBase += '			</div>';
			tmpBase += '		</div>';
			tmpBase += '	</div>';
			tmpBase += '</div>';


		/////////////////////////
		//      Functions      //
		/////////////////////////

		// 1. paste html to cursor position
		function pasteHtmlAtCaret(html) {
			var sel, range;
			if (window.getSelection) {
				sel = window.getSelection();
				var parentNode = $(sel.anchorNode).parent(); //  we can extract parentNode of selction area
				if (sel.getRangeAt && sel.rangeCount) {
					range = sel.getRangeAt(0);
					range.deleteContents();
					var el = document.createElement("div");
					el.innerHTML = html;
					var frag = document.createDocumentFragment(), node, lastNode;
					while ( (node = el.firstChild) ) {
						lastNode = frag.appendChild(node);
					}					
					range.insertNode(frag);
					if (lastNode) {
						range = range.cloneRange();
						range.setStartAfter(lastNode);
						range.collapse(true);
						sel.removeAllRanges();
						sel.addRange(range);
					}
				}
			} else if (document.selection && document.selection.type != "Control") {
				document.selection.createRange().pasteHTML(html);
			}
		}

		// 2. move focus to end of element	
		function placeCaretAtEnd(el) {				
			el.focus();
			if (typeof window.getSelection != "undefined"
					&& typeof document.createRange != "undefined") {
				var range = document.createRange();       
				range.selectNodeContents(el);
				range.collapse(false);
				var sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
	  
			} else if (typeof document.body.createTextRange != "undefined") {
				var textRange = document.body.createTextRange();
				textRange.moveToElementText(el);
				textRange.collapse(false);
				textRange.select();
			}
		}
		
		  
		// 3. save or restore of editor selection 
		var saveSelection, restoreSelection;
		if (window.getSelection && document.createRange) {
			saveSelection = function(el) {
				var sel = window.getSelection && window.getSelection();
				if (sel && sel.rangeCount > 0) {
					return sel.getRangeAt(0);
				}
			};

			restoreSelection = function(el, sel) {
				var range = document.createRange();
				range.setStart(sel.startContainer, sel.startOffset);
				range.setEnd(sel.endContainer, sel.endOffset)
				
				sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
		} else if (document.selection && document.body.createTextRange) {
			saveSelection = function(el) {
				return document.selection.createRange();
			};

			restoreSelection = function(el, sel) {
				var textRange = document.body.createTextRange();
				textRange.moveToElementText(el);
				textRange.setStart(sel.startContanier, sel.startOffset);
				textRange.setEnd(sel.endContainer, sel.endOffset);
				textRange.select();
			};
		}

		// Html or text work
		function htmlFromText(str, self) {
			str = str
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#x27;')
				.replace(/`/g, '&#x60;')
				.replace(/(?:\r\n|\r|\n)/g, '\n')
				.replace(/(\n+)/g, '<div>$1</div>')
				.replace(/\n/g, '<br/>')
				.replace(/<br\/><\/div>/g, '</div>');						
			return str;
		}
		function textFromHtml(str) {
			str = str
				.replace(/<img[^>]*alt="([^"]+)"[^>]*>/ig, '$1')
				.replace(/\n|\r/g, '')
				.replace(/<br[^>]*>/ig, '\n')
				.replace(/(?:<(?:div|p|ol|ul|li|pre|code|object)[^>]*>)+/ig, '<div>')
				.replace(/(?:<\/(?:div|p|ol|ul|li|pre|code|object)>)+/ig, '</div>')
				.replace(/\n<div><\/div>/ig, '\n')
				.replace(/<div><\/div>\n/ig, '\n')
				.replace(/(?:<div>)+<\/div>/ig, '\n')
				.replace(/([^\n])<\/div><div>/ig, '$1\n')
				.replace(/(?:<\/div>)+/ig, '</div>')
				.replace(/([^\n])<\/div>([^\n])/ig, '$1\n$2')
				.replace(/<\/div>/ig, '')
				.replace(/([^\n])<div>/ig, '$1\n')
				.replace(/\n<div>/ig, '\n')
				.replace(/<div>\n/ig, '\n\n')
				.replace(/<(?:[^>]+)?>/g, '')
				.replace(new RegExp(invisibleChar, 'g'), '')
				.replace(/&nbsp;/g, ' ')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#x27;/g, "'")
				.replace(/&#x60;/g, '`')
				.replace(/&amp;/g, '&');
			str = emojione.toShort(str);
			return str;
		}
      

		this.test = function() {
			 /* TEST AREA: S*/
		}

		/*
		*	Class Emj declare
		*/
        var Emj = function(element, options) {
			var self = this; // Emj instance this
			emojione.unicodeAlt = false; // for database stable
			emojione.greedyMatch = true; // set to true for greedy unicode matching
			emojione.imagePathPNG = options.themes[options.theme].imgPath;
			self.opts = options;
			self.cp = 0; // init cursor position.
			// emj.init();
		};
		// Lazy Load images  
		Emj.prototype.lazyLoading= function() {
			var self = this; // Emj instance this			
			if (self.lasyEmoji[0]) {
				var pickerTop = self.picker.offset().top,
					pickerBottom = pickerTop + self.picker.height() + 20;
				self.lasyEmoji.each(function() {
					var e = $(this), top = e.offset().top;
					if (top > pickerTop && top < pickerBottom) {
						e.attr("src", e.data("src")).removeClass("lazy-emoji");
					}
				})
				self.lasyEmoji = self.lasyEmoji.filter(".lazy-emoji");				
			}
		}
		Emj.prototype.shortnameToImageFromReplacer= function(name, lazy) {
			var self = this;
			var img = $('<img/>',{'class': 'emj-icon emj-icon-replacer'}).attr({
					'title': self.opts.replacer[name].title,
					'data-src': self.opts.replacer[name].src
				});
			if (lazy) {
				img.addClass('lazy-emoji');
			} else {
				img.attr({
					'src': self.opts.replacer[name].src
				});
			}
			return img.wrap('<p>').parent().html();
		}	
		// get custom imoji Html
		Emj.prototype.shortnameToImageFromCustom= function(name, lazy) {
			var self = this;
			var imgCustom = $.map(self.opts.customEmoji, function(val, i){
				if (val.name == name) {
					return val;
				};
			});
			if (imgCustom.length > 0) { 
				var img = $('<img/>',{'class': 'emj-icon emj-icon-custom'}).attr({
						'title': imgCustom[0].name,
						'data-src': imgCustom[0].src
					});
				if (lazy) {
					img.addClass('lazy-emoji');
				} else {
					img.attr({
						'src': imgCustom[0].src
					});
				}				
				return img.wrap('<p>').parent().html();
			}
			return name;
		}
		Emj.prototype.shortnameToImagesForPaste = function(text) {
			var self = this;
      
			emojione.imagePathPNG = self.opts.themes[self.opts.theme].imgPath;
            emojione.ascii = true;
			var temp = emojione.shortnameToImage(text);
			temp = emojione.unicodeToImage(temp);
			//var temp = emojione.toImage(text);
			var textJquery = $($.parseHTML(temp));
			var div = $('<div/>');
			div.append(textJquery);
			div.find('img').switchClass('emojione','emj-icon');
			var imgHtml = div.html();
			return imgHtml;
		}
		Emj.prototype.unicodeToImages = function(text) {
			str = emojione.toShort(str); // it doesn't support greedy match
			var html = self.shortnameToImagesForPaste(text);
			return html;
		}
		// It use better logic to load emoji
		Emj.prototype.shornameToImage = function(str, template, lazy) {
			var self = this;
			 return str.replace(/:?\+?[\w_\-]+:?/g, function(shortname) {
				 // 0. null check
				if( (typeof shortname === 'undefined') || (shortname === '')) {
					return shortname;
				}
				shortname = ":" + shortname.replace(/:$/,'').replace(/^:/,'') + ":";				
				// map shortname to parent
				if (!emojione.emojioneList[shortname]) {
					for ( var emoji in emojione.emojioneList ) {
						if (!emojione.emojioneList.hasOwnProperty(emoji) || (emoji === '')) continue;
						if (emojione.emojioneList[emoji].shortnames.indexOf(shortname) === -1) continue;
						shortname = emoji;
						break;
					}
				}
				// 1. replacer check
				if (self.opts.replacer[shortname]) {
					var img = self.shortnameToImageFromReplacer(shortname, lazy);
						img = $($.parseHTML(img));
					var i = $('<i>',{'class': 'emjbtn'}).attr({
							'role': 'button',
							'data-name': shortname
						});
					img.wrap(i);
					return img.parent().wrap('<p>').parent().html();
				}
				// 2. custom emoji check 
				if (emojione.shortnames.indexOf(shortname) === -1) {
					var img = self.shortnameToImageFromCustom(shortname,lazy);
					if (img == shortname) {
						return shortname;
					}					
						img = $($.parseHTML(img));
					var i = $('<i>',{'class': 'emjbtn'}).attr({
							'role': 'button',
							'data-name': shortname
						});
					img.wrap(i);
					return img.parent().wrap('<p>').parent().html();
				}
				var unicode = emojione.emojioneList[shortname];
				if (unicode) {
					unicode = emojione.emojioneList[shortname].uc_output;
					var fname = emojione.emojioneList[shortname].uc_base;
					var category = (fname.indexOf("-1f3f") != -1) ? 'diversity' : emojione.emojioneList[shortname].category;
					var title = emojione.imageTitleTag ? 'title="' + shortname + '"' : '';
					var ePath = self.opts.themes[self.opts.theme].imgPath;
					var alt = (emojione.unicodeAlt) ? emojione.convert(unicode.toUpperCase()) : shortname;
					if (!template) {
                        template = '<img class="emj-icon {lazy}" alt="{alt}" {title} data-src="{src}.png" {attrsrc} />'
                    }
                    var replaceWith = template.replace('{alt}',alt)
							.replace('{title}',title)
                            .replace('{lazy}', (lazy == true) ? 'lazy-emoji' : '')
                            .replace('{attrsrc}', (lazy == true) ? '' : 'src='+ePath + fname + '.png')
							.replace('{shortname}',shortname)
							.replace('{src}',ePath + fname);

					return replaceWith;
				}
				return shortname;
			});
		}

		Emj.prototype.loadImj = function(filter, params) {
			var imgs = '';
			var self = this;
			var pickerImojiTemplate =  '<i class="emjbtn" role="button" data-name="{shortname}">';
			pickerImojiTemplate		+=   '<img class="emj-icon lazy-emoji" alt="{alt}" {title} data-src="{src}.png"/>';
			pickerImojiTemplate		+= '</i>';
			items = params.emoji.join('|');
			imgs = self.shornameToImage(items, pickerImojiTemplate, true).split('|').join('');
			var textJquery = $($.parseHTML(imgs));
			var div = $('<div/>');
			div.append(textJquery);
			var imgHtml = div.html();
			return imgHtml;
		}	

        // It must run each element
        return this.each(function() {
            // set opts
            var opts = $.extend( {}, $.fn.emj.defaults, options );
			emojione.imagePathPNG = opts.themes[opts.theme].imgPath;
			console.log('inside plugin');
			/* Actual logic start */
			// 1. New Emj instance
			var emj = new Emj($(this),opts);
			// 2. Prepare Template
            _.templateSettings.variable = "rc";
            // 2.1 Grab the HTML out of our template tag and pre-compile it.
            var template = _.template(tmpBase);
            // 2.2 Define our render data (to be put into the "rc" variable).
            var editor = $(this).clone(true, true); // deep copy of actual editor
            var templateData = {
                   emj: emj
                 , opts: opts
            };
			// 2.3 Load template
            var base = $(template( templateData ));
			var btnBox = base.find('.emj-btn-box');
			var picker = base.find('.emj-picker');
			var tabs = base.find('.emj-tab');
			var scrollArea = base.find('.emj-scroll-area');
			var categories = base.find('.emj-category');
			// 2.4 set vars to emj instance
			emj.editor = editor;
			emj.picker = picker;
			emj.lasyEmoji = picker.find('.lazy-emoji');
			emj.btnBox = btnBox;
			emj.sel = false;
			// 2.4 Adapt template to actual dom
            base.find('.emj-editor-dummy').replaceWith(editor.addClass('emj-editor'));
            $(this).replaceWith(base);

			// 2.4 init editor
            placeCaretAtEnd(emj.editor[0]);
            emj.sel = saveSelection(emj.editor[0]);

			/*
			*  3. Bind All events  
			*/
				// 3.1 trigger btn click event
				btnBox.on('click',function(){
					if (picker.is(':visible')){
						picker.fadeOut();
						$(this).removeClass('active');
					} else {
						picker.fadeIn();
						$(this).addClass('active');
						emj.lazyLoading();
					}
				});
				// 3.1 emj icon click event
				base.find('.emj-category .emjbtn').on('click',function(){
					editor.focus(); // force focus to editor always          
					restoreSelection(editor[0], emj.sel);          
					var textJquery = $($.parseHTML($(this).html()));
					var div = $('<div/>');
					div.append(textJquery);
					div.find('img').attr('alt','');
					var imgHtml = div.html();        
					pasteHtmlAtCaret(imgHtml);
					emj.sel = saveSelection(editor[0]);
				});
				// 3.1.1 paste on editer event: In progress
				editor.on('paste',function(event){  
					// get clipboard text
					if (opts.useSpecialMarkup) {
						if (event.originalEvent.clipboardData) {
							var text = event.originalEvent.clipboardData.getData('text/plain');					
							//$.each(opts.markup, function(index, rule){
							//	text = text.replace(rule.synonyms, ':'+rule.name+':');
							//});
							var html = htmlFromText(text);
								html = emj.shortnameToImagesForPaste(html);
								
							editor.focus(); // force focus to editor always
							restoreSelection(editor[0], emj.sel);
							pasteHtmlAtCaret(html);
							emj.sel = saveSelection(editor[0]);

							if (event.preventDefault){
								event.preventDefault();
							} else {
								event.stop();
							};

							event.returnValue = false;
							event.stopPropagation();
							return false;
						}
					}				
				});
				// 3.1.2 block generating <div> when type enter on div(contenteditable)
				editor.on('keypress', function(e){
					if (e.keyCode === 13) {
						// small hack for ui autocomplete conflict when user type enter on autocomplete
						if (opts.enterToBr && !$('.ui-autocomplete').is(':visible')) {
							document.execCommand('insertHTML', false, ' <br><br>');
                            return false;
						}
					}
				});
				// 3.1.3 save editor cursor on focus or blur
				editor.on("mousedown mouseup click keyup keydown keypress", function(e){					        
					emj.sel = saveSelection(editor[0]);				
				});
				// 3.2 tab click and scrollTo
				base.find('.emj-tab').on('click',function(){
					var tab = $(this).data('tab');
					var isActive = $(this).is(".active");
					// tab active switch
					if (!isActive) {
						tabs.filter(".active").removeClass("active");
						$(this).addClass("active");
					}
					var headerOffset = base.find('.emj-ct-'+tab).offset().top;				
					var scroll = scrollArea.scrollTop();
					var offsetTop = scrollArea.offset().top;
					// scroll to specific category
					scrollArea.stop().animate({
						scrollTop: headerOffset + scroll - offsetTop - 2
					}, 200, 'swing', function () {
						
					});
				});

				// 3.3 scroll event on ScrollArea
				scrollArea.on('scroll', function () {
					emj.lazyLoading();
					var item = categories.eq(0), scrollTop = scrollArea.offset().top;
					categories.each(function (i, e) {
						if ($(e).offset().top - scrollTop >= 10) {
							return false;
						}
						item = $(e);
					});
					var tab = tabs.filter('.emj-tab-'+ item.data("category"));
					if (tab[0] && !tab.is(".active")) {
						tabs.removeClass("active");
						tab.addClass("active");
					}
				});

				// 3.4 hide when user click outside of editor
				$(document).mouseup(function(e) {
					var container = $(".emj-container");
					// if the target of the click isn't the container nor a descendant of the container
					if (!container.is(e.target) && container.has(e.target).length === 0) 
					{
						emj.picker.fadeOut();					
						emj.btnBox.removeClass('active');
					}
				});
                // test
                if ($.isFunction(opts.afterInit)) {
                    if (!opts.afterInit.call(this,emj)) {
                        console.log('error occure while run after Init.');
                    }
                }

            // bind emj object
            $(this).data('emj', emj);
        });
    };
 

    // Plugin defaults
    $.fn.emj.defaults = {
          theme: 'emojione'
        , enterToBr: true  // when user type enter it replace to <br><br>
        , afterInit: function() { // after init callback
            return true;
         }
		, themes: {
			emojione: {
				"name" : "emojione",
				"version": "3.1.0",
				"size": "32",
				"imgPath": "/images/emoji/emojione/3.1.0/png/32/"
				//https://cdnjs.cloudflare.com/ajax/libs/emojione/2.2.7/assets/png/
			},
			twemoji: {
				"name" : "twemoji",
				"version": "2.3",
				"size": "32",
				"imgPath": "https://abs.twimg.com/emoji/v2/72x72/" // https://abs.twimg.com/emoji/v2/72x72/
			},
            queeraz: {
				"name" : "queeraz", // emojione, twemoji, etc...
				"version": "1.0",
				"size": "32",
				"imgPath": "/some/image/path/for/queeraz/" // https://abs.twimg.com/emoji/v2/72x72/
			}
			
		}
        , pickerPosition: 'right' // left, right, top, bottom
		, useSpecialMarkup: true
		, replacer: {
            /*
			':smile:': {
				title: 'somenew',
				src: '/images/emoji/emojione/3.1.0/png/32/1f621.png'
			}*/
		}
		, markup: [
			{
				name: 'smile',
				synonyms: /:\)|:-\)/g
			},
			{
				name: 'wink',
				synonyms: /;\)/g
			},
			{
				name: 'open_mouth',
				synonyms: /:o/g
			},
			{
				name: 'scream',
				synonyms: /:-o/g
			},
			{
				name: 'smirk',
				synonyms: /:-]/g
			},
			{
				name: 'grinning',
				synonyms: /:-D/g
			},
			{
				name: 'stuck_out_tongue_closed_eyes',
				synonyms: /X-D/g
			},
			{
				name: 'heart',
				synonyms: /<3/g
			},
			{
				name: 'thumbsup',
				synonyms: /:\+1/g
			},
			{
				name: 'thumbsdown',
				synonyms: /:\-1/g
			}
		]
		, customEmoji:[
			{
				name: ":queeraz_icon:",
				src: "/images/default_profile_icon_35x35.jpg"
			},					{
				name: ":queeraz_demo2:",
				src: "/images/emoji/emojione/3.1.0/png/32/1f46c.png"
			},					{
				name: ":queeraz_demo3:",
				src: "/images/emoji/emojione/3.1.0/png/32/1f46d.png"
			}
		
		]
        , filters: {
            smileys_people: {
				key: "smileys_people",
				type: "default",
                icon: "yum",
                title: "Smileys & People",
                emoji: [
                      "grinning", "grimacing", "grin", "joy", "smiley", "smile", "sweat_smile", "laughing", "innocent", "wink", "blush", "slight_smile"
                    , "upside_down", "relaxed", "yum", "relieved", "heart_eyes", "kissing_heart", "kissing", "kissing_smiling_eyes"
                    , "kissing_closed_eyes", "stuck_out_tongue_winking_eye", "stuck_out_tongue_closed_eyes", "stuck_out_tongue"
                    , "money_mouth", "nerd", "sunglasses", "hugging", "smirk", "no_mouth", "neutral_face", "expressionless", "unamused", "rolling_eyes"
                    , "thinking", "flushed", "disappointed", "worried", "angry", "rage", "pensive", "confused", "slight_frown", "frowning2", "persevere"
                    , "confounded", "tired_face", "weary", "triumph", "open_mouth", "scream", "fearful", "cold_sweat", "hushed", "frowning", "anguished"
                    , "cry", "disappointed_relieved", "sleepy", "sweat", "sob", "dizzy_face", "astonished", "zipper_mouth", "mask", "thermometer_face"
                    , "head_bandage", "sleeping", "zzz", "poop", "smiling_imp", "imp", "japanese_ogre", "japanese_goblin", "skull", "ghost", "alien", "robot"
                    , "smiley_cat", "smile_cat", "joy_cat", "heart_eyes_cat", "smirk_cat", "kissing_cat", "scream_cat", "crying_cat_face"
                    , "pouting_cat", "raised_hands", "clap", "wave", "thumbsup", "thumbsdown", "punch", "fist", "v", "ok_hand", "raised_hand", "open_hands"
                    , "muscle", "pray", "point_up", "point_up_2", "point_down", "point_left", "point_right", "middle_finger", "hand_splayed", "metal"
                    , "vulcan", "writing_hand", "nail_care", "lips", "tongue", "ear", "nose", "eye", "eyes", "bust_in_silhouette", "busts_in_silhouette"
                    , "speaking_head", "baby", "boy", "girl", "man", "woman", "person_with_blond_hair", "older_man", "older_woman", "man_with_gua_pi_mao"
                    , "man_with_turban", "cop", "construction_worker", "guardsman", "spy", "santa", "angel", "princess", "bride_with_veil", "walking"
                    , "runner", "dancer", "dancers", "couple", "two_men_holding_hands", "two_women_holding_hands", "bow", "information_desk_person"
                    , "no_good", "ok_woman", "raising_hand", "person_with_pouting_face", "person_frowning", "haircut", "massage", "couple_with_heart"
                    , "couple_ww", "couple_mm", "couplekiss", "kiss_ww", "kiss_mm", "family", "family_mwg", "family_mwgb", "family_mwbb", "family_mwgg"
                    , "family_wwb", "family_wwg", "family_wwgb", "family_wwbb", "family_wwgg", "family_mmb", "family_mmg", "family_mmgb", "family_mmbb"
                    , "family_mmgg", "womans_clothes", "shirt", "jeans", "necktie", "dress", "bikini", "kimono", "lipstick", "kiss", "footprints", "high_heel"
                    , "sandal", "boot", "mans_shoe", "athletic_shoe", "womans_hat", "tophat", "helmet_with_cross", "mortar_board", "crown", "school_satchel"
                    , "pouch", "purse", "handbag", "briefcase", "eyeglasses", "dark_sunglasses", "ring", "closed_umbrella"
                ]
            },

            animals_nature: {
				key: "animals_nature",
				type: "default",
                icon: "hamster",
                title: "Animals & Nature",
                emoji: [
                    "dog", "cat", "mouse", "hamster", "rabbit", "bear", "panda_face", "koala", "tiger", "lion_face", "cow", "pig", "pig_nose", "frog"
                    ,"octopus", "monkey_face", "see_no_evil", "hear_no_evil", "speak_no_evil", "monkey", "chicken", "penguin", "bird", "baby_chick"
                    ,"hatching_chick", "hatched_chick", "wolf", "boar", "horse", "unicorn", "bee", "bug", "snail", "beetle", "ant", "spider", "scorpion", "crab"
                    ,"snake", "turtle", "tropical_fish", "fish", "blowfish", "dolphin", "whale", "whale2", "crocodile", "leopard", "tiger2", "water_buffalo"
                    ,"ox", "cow2", "dromedary_camel", "camel", "elephant", "goat", "ram", "sheep", "racehorse", "pig2", "rat", "mouse2", "rooster", "turkey", "dove"
                    ,"dog2", "poodle", "cat2", "rabbit2", "chipmunk", "feet", "dragon", "dragon_face", "cactus", "christmas_tree", "evergreen_tree"
                    ,"deciduous_tree", "palm_tree", "seedling", "herb", "shamrock", "four_leaf_clover", "bamboo", "tanabata_tree", "leaves"
                    ,"fallen_leaf", "maple_leaf", "ear_of_rice", "hibiscus", "sunflower", "rose", "tulip", "blossom", "cherry_blossom", "bouquet"
                    ,"mushroom", "chestnut", "jack_o_lantern", "shell", "spider_web", "earth_americas", "earth_africa", "earth_asia", "full_moon"
                    ,"waning_gibbous_moon", "last_quarter_moon", "waning_crescent_moon", "new_moon", "waxing_crescent_moon"
                    ,"first_quarter_moon", "waxing_gibbous_moon", "new_moon_with_face", "full_moon_with_face", "first_quarter_moon_with_face"
                    ,"last_quarter_moon_with_face", "sun_with_face", "crescent_moon", "star", "star2", "dizzy", "sparkles", "comet", "sunny"
                    ,"white_sun_small_cloud", "partly_sunny", "white_sun_cloud", "white_sun_rain_cloud", "cloud", "cloud_rain"
                    ,"thunder_cloud_rain", "cloud_lightning", "zap", "fire", "boom", "snowflake", "cloud_snow", "snowman2", "snowman", "wind_blowing_face"
                    ,"dash", "cloud_tornado", "fog", "umbrella2", "umbrella", "droplet", "sweat_drops", "ocean"
                ]
            },

            food_drink: {
				key: "food_drink",
				type: "default",
                icon: "pizza",
                title: "Food & Drink",
                emoji: [
                    "green_apple", "apple", "pear", "tangerine", "lemon", "banana", "watermelon", "grapes", "strawberry", "melon", "cherries", "peach"
                    , "pineapple", "tomato", "eggplant", "hot_pepper", "corn", "sweet_potato", "honey_pot", "bread", "cheese", "poultry_leg", "meat_on_bone"
                    , "fried_shrimp", "egg", "hamburger", "fries", "hotdog", "pizza", "spaghetti", "taco", "burrito", "ramen", "stew", "fish_cake", "sushi", "bento"
                    , "curry", "rice_ball", "rice", "rice_cracker", "oden", "dango", "shaved_ice", "ice_cream", "icecream", "cake", "birthday", "custard", "candy"
                    , "lollipop", "chocolate_bar", "popcorn", "doughnut", "cookie", "beer", "beers", "wine_glass", "cocktail", "tropical_drink", "champagne"
                    , "sake", "tea", "coffee", "baby_bottle", "fork_and_knife", "fork_knife_plate"
                ]
            },

            activity: {
				key: "activity",
				type: "default",
                icon: "basketball",
                title: "Activity",
                emoji: [
                    "soccer", "basketball", "football", "baseball", "tennis", "volleyball", "rugby_football", "8ball", "golf", "golfer", "ping_pong"
                    , "badminton", "hockey", "field_hockey", "cricket", "ski", "skier", "snowboarder", "ice_skate", "bow_and_arrow", "fishing_pole_and_fish"
                    , "rowboat", "swimmer", "surfer", "bath", "basketball_player", "lifter", "bicyclist", "mountain_bicyclist", "horse_racing"
                    , "trophy", "running_shirt_with_sash", "medal", "military_medal", "reminder_ribbon", "rosette", "ticket", "tickets", "performing_arts"
                    , "art", "circus_tent", "microphone", "headphones", "musical_score", "musical_keyboard", "saxophone", "trumpet", "guitar", "violin"
                    , "clapper", "video_game", "space_invader", "dart", "game_die", "slot_machine", "bowling"
                ]
            },

            travel_places: {
				key: "travel_places",
				type: "default",
                icon: "rocket",
                title: "Travel & Places",
                emoji: [
                    "red_car", "taxi", "blue_car", "bus", "trolleybus", "race_car", "police_car", "ambulance", "fire_engine", "minibus", "truck"
                    , "articulated_lorry", "tractor", "motorcycle", "bike", "rotating_light", "oncoming_police_car", "oncoming_bus"
                    , "oncoming_automobile", "oncoming_taxi", "aerial_tramway", "mountain_cableway", "suspension_railway", "railway_car"
                    , "train", "monorail", "bullettrain_side", "bullettrain_front", "light_rail", "mountain_railway", "steam_locomotive", "train2"
                    , "metro", "tram", "station", "helicopter", "airplane_small", "airplane", "airplane_departure", "airplane_arriving", "sailboat"
                    , "motorboat", "speedboat", "ferry", "cruise_ship", "rocket", "satellite_orbital", "seat", "anchor", "construction", "fuelpump", "busstop"
                    , "vertical_traffic_light", "traffic_light", "checkered_flag", "ship", "ferris_wheel", "roller_coaster", "carousel_horse"
                    , "construction_site", "foggy", "tokyo_tower", "factory", "fountain", "rice_scene", "mountain", "mountain_snow", "mount_fuji", "volcano"
                    , "japan", "camping", "tent", "park", "motorway", "railway_track", "sunrise", "sunrise_over_mountains", "desert", "beach", "island"
                    , "city_sunset", "city_dusk", "cityscape", "night_with_stars", "bridge_at_night", "milky_way", "stars", "sparkler", "fireworks"
                    , "rainbow", "homes", "european_castle", "japanese_castle", "stadium", "statue_of_liberty", "house", "house_with_garden"
                    , "house_abandoned", "office", "department_store", "post_office", "european_post_office", "hospital", "bank", "hotel"
                    , "convenience_store", "school", "love_hotel", "wedding", "classical_building", "church", "mosque", "synagogue", "kaaba", "shinto_shrine"
                ]
            },

            objects: {
				key: "objects",
				type: "default",
                icon: "bulb",
                title: "Objects",
                emoji: [
                    "watch", "iphone", "calling", "computer", "keyboard", "desktop", "printer", "mouse_three_button", "trackball", "joystick"
                    , "compression", "minidisc", "floppy_disk", "cd", "dvd", "vhs", "camera", "camera_with_flash", "video_camera", "movie_camera", "projector"
                    , "film_frames", "telephone_receiver", "telephone", "pager", "fax", "tv", "radio", "microphone2", "level_slider", "control_knobs"
                    , "stopwatch", "timer", "alarm_clock", "clock", "hourglass_flowing_sand", "hourglass", "satellite", "battery", "electric_plug", "bulb"
                    , "flashlight", "candle", "wastebasket", "oil", "money_with_wings", "dollar", "yen", "euro", "pound", "moneybag", "credit_card", "gem", "scales"
                    , "wrench", "hammer", "hammer_pick", "tools", "pick", "nut_and_bolt", "gear", "chains", "gun", "bomb", "knife", "dagger", "crossed_swords", "shield"
                    , "smoking", "skull_crossbones", "coffin", "urn", "amphora", "crystal_ball", "prayer_beads", "barber", "alembic", "telescope", "microscope"
                    , "hole", "pill", "syringe", "thermometer", "label", "bookmark", "toilet", "shower", "bathtub", "key", "key2", "couch", "sleeping_accommodation"
                    , "bed", "door", "bellhop", "frame_photo", "map", "beach_umbrella", "moyai", "shopping_bags", "balloon", "flags", "ribbon", "gift", "confetti_ball"
                    , "tada", "dolls", "wind_chime", "crossed_flags", "izakaya_lantern", "envelope", "envelope_with_arrow", "incoming_envelope", "e-mail"
                    , "love_letter", "postbox", "mailbox_closed", "mailbox", "mailbox_with_mail", "mailbox_with_no_mail", "package", "postal_horn"
                    , "inbox_tray", "outbox_tray", "scroll", "page_with_curl", "bookmark_tabs", "bar_chart", "chart_with_upwards_trend"
                    , "chart_with_downwards_trend", "page_facing_up", "date", "calendar", "calendar_spiral", "card_index", "card_box", "ballot_box"
                    , "file_cabinet", "clipboard", "notepad_spiral", "file_folder", "open_file_folder", "dividers", "newspaper2", "newspaper", "notebook"
                    , "closed_book", "green_book", "blue_book", "orange_book", "notebook_with_decorative_cover", "ledger", "books", "book", "link"
                    , "paperclip", "paperclips", "scissors", "triangular_ruler", "straight_ruler", "pushpin", "round_pushpin", "triangular_flag_on_post"
                    , "flag_white", "flag_black", "closed_lock_with_key", "lock", "unlock", "lock_with_ink_pen", "pen_ballpoint", "pen_fountain"
                    , "black_nib", "pencil", "pencil2", "crayon", "paintbrush", "mag", "mag_right"
                ]
            },

            symbols: {
				key: "symbols",
				type: "default",
                icon: "heartpulse",
                title: "Symbols",
                emoji: [
                    "heart", "yellow_heart", "green_heart", "blue_heart", "purple_heart", "broken_heart", "heart_exclamation", "two_hearts"
                    , "revolving_hearts", "heartbeat", "heartpulse", "sparkling_heart", "cupid", "gift_heart", "heart_decoration", "peace", "cross"
                    , "star_and_crescent", "om_symbol", "wheel_of_dharma", "star_of_david", "six_pointed_star", "menorah", "yin_yang", "orthodox_cross"
                    , "place_of_worship", "ophiuchus", "aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpius", "sagittarius", "capricorn"
                    , "aquarius", "pisces", "id", "atom", "u7a7a", "u5272", "radioactive", "biohazard", "mobile_phone_off", "vibration_mode", "u6709", "u7121"
                    , "u7533", "u55b6", "u6708", "eight_pointed_black_star", "vs", "accept", "white_flower", "ideograph_advantage", "secret", "congratulations"
                    , "u5408", "u6e80", "u7981", "a", "b", "ab", "cl", "o2", "sos", "no_entry", "name_badge", "no_entry_sign", "x", "o", "anger", "hotsprings", "no_pedestrians"
                    , "do_not_litter", "no_bicycles", "non-potable_water", "underage", "no_mobile_phones", "exclamation", "grey_exclamation", "question"
                    , "grey_question", "bangbang", "interrobang", "100", "low_brightness", "high_brightness", "trident", "fleur-de-lis", "part_alternation_mark"
                    , "warning", "children_crossing", "beginner", "recycle", "u6307", "chart", "sparkle", "eight_spoked_asterisk", "negative_squared_cross_mark"
                    , "white_check_mark", "diamond_shape_with_a_dot_inside", "cyclone", "loop", "globe_with_meridians", "m", "atm", "sa", "passport_control"
                    , "customs", "baggage_claim", "left_luggage", "wheelchair", "no_smoking", "wc", "parking", "potable_water", "mens", "womens", "baby_symbol"
                    , "restroom", "put_litter_in_its_place", "cinema", "signal_strength", "koko", "ng", "ok", "up", "cool", "new", "free", "zero", "one", "two", "three", "four"
                    , "five", "six", "seven", "eight", "nine", "ten", "1234", "arrow_forward", "pause_button", "play_pause", "stop_button", "record_button", "track_next"
                    , "track_previous", "fast_forward", "rewind", "twisted_rightwards_arrows", "repeat", "repeat_one", "arrow_backward", "arrow_up_small"
                    , "arrow_down_small", "arrow_double_up", "arrow_double_down", "arrow_right", "arrow_left", "arrow_up", "arrow_down", "arrow_upper_right"
                    , "arrow_lower_right", "arrow_lower_left", "arrow_upper_left", "arrow_up_down", "left_right_arrow", "arrows_counterclockwise"
                    , "arrow_right_hook", "leftwards_arrow_with_hook", "arrow_heading_up", "arrow_heading_down", "hash", "asterisk", "information_source"
                    , "abc", "abcd", "capital_abcd", "symbols", "musical_note", "notes", "wavy_dash", "curly_loop", "heavy_check_mark", "arrows_clockwise"
                    , "heavy_plus_sign", "heavy_minus_sign", "heavy_division_sign", "heavy_multiplication_x", "heavy_dollar_sign", "currency_exchange"
                    , "copyright", "registered", "tm", "end", "back", "on", "top", "soon", "ballot_box_with_check", "radio_button", "white_circle", "black_circle"
                    , "red_circle", "small_orange_diamond", "small_blue_diamond", "large_orange_diamond", "large_blue_diamond"
                    , "small_red_triangle", "black_small_square", "white_small_square", "black_large_square", "white_large_square", "small_red_triangle_down"
                    , "black_medium_square", "white_medium_square", "black_medium_small_square", "white_medium_small_square", "black_square_button"
                    , "white_square_button", "speaker", "sound", "loud_sound", "mute", "mega", "loudspeaker", "bell", "no_bell", "black_joker", "mahjong", "spades"
                    , "clubs", "hearts", "diamonds", "flower_playing_cards", "thought_balloon", "anger_right", "speech_balloon", "clock1", "clock2", "clock3"
                    , "clock4", "clock5", "clock6", "clock7", "clock8", "clock9", "clock10", "clock11", "clock12", "clock130", "clock230", "clock330", "clock430"
                    , "clock530", "clock630", "clock730", "clock830", "clock930", "clock1030", "clock1130", "clock1230", "eye_in_speech_bubble"
                ]
            },

            flags: {
				key: "flags",
				type: "default",
                icon: "flag_gb",
                title: "Flags",
                emoji: [
					  "flag_ac", "flag_af", "flag_al", "flag_dz", "flag_ad", "flag_ao", "flag_ai", "flag_ag", "flag_ar", "flag_am", "flag_aw", "flag_au", "flag_at", "flag_az", "flag_bs", "flag_bh", "flag_bd", "flag_bb", "flag_by", "flag_be", "flag_bz", "flag_bj", "flag_bm", "flag_bt", "flag_bo", "flag_ba", "flag_bw", "flag_br", "flag_bn", "flag_bg", "flag_bf", "flag_bi"
					, "flag_cv", "flag_kh", "flag_cm", "flag_ca", "flag_ky", "flag_cf", "flag_td", "flag_cl", "flag_cn", "flag_co", "flag_km", "flag_cg", "flag_cd", "flag_cr", "flag_hr", "flag_cu", "flag_cy", "flag_cz", "flag_dk", "flag_dj", "flag_dm", "flag_do", "flag_ec", "flag_eg", "flag_sv", "flag_gq", "flag_er", "flag_ee", "flag_et", "flag_fk", "flag_fo"
					, "flag_fj", "flag_fi", "flag_fr", "flag_pf", "flag_ga", "flag_gm", "flag_ge", "flag_de", "flag_gh", "flag_gi", "flag_gr", "flag_gl", "flag_gd", "flag_gu", "flag_gt", "flag_gn", "flag_gw", "flag_gy", "flag_ht", "flag_hn", "flag_hk", "flag_hu", "flag_is", "flag_in", "flag_id", "flag_ir", "flag_iq", "flag_ie", "flag_il", "flag_it", "flag_ci", "flag_jm", "flag_jp"
					, "flag_je", "flag_jo", "flag_kz", "flag_ke", "flag_ki", "flag_xk", "flag_kw", "flag_kg", "flag_la", "flag_lv", "flag_lb", "flag_ls", "flag_lr", "flag_ly", "flag_li", "flag_lt", "flag_lu", "flag_mo", "flag_mk", "flag_mg", "flag_mw", "flag_my", "flag_mv", "flag_ml", "flag_mt", "flag_mh", "flag_mr", "flag_mu", "flag_mx", "flag_fm", "flag_md", "flag_mc", "flag_mn", "flag_me"
					, "flag_ms", "flag_ma", "flag_mz", "flag_mm", "flag_na", "flag_nr", "flag_np", "flag_nl", "flag_nc", "flag_nz", "flag_ni", "flag_ne", "flag_ng", "flag_nu", "flag_kp", "flag_no", "flag_om", "flag_pk", "flag_pw", "flag_ps", "flag_pa", "flag_pg", "flag_py", "flag_pe", "flag_ph", "flag_pl", "flag_pt", "flag_pr", "flag_qa", "flag_ro", "flag_ru", "flag_rw"
					, "flag_sh", "flag_kn", "flag_lc", "flag_vc", "flag_ws", "flag_sm", "flag_st", "flag_sa", "flag_sn", "flag_rs", "flag_sc", "flag_sl", "flag_sg", "flag_sk", "flag_si", "flag_sb", "flag_so", "flag_za", "flag_kr", "flag_es", "flag_lk", "flag_sd", "flag_sr", "flag_sz", "flag_se", "flag_ch", "flag_sy", "flag_tw", "flag_tj", "flag_tz", "flag_th", "flag_tl"
					, "flag_tg", "flag_to", "flag_tt", "flag_tn", "flag_tr", "flag_tm", "flag_tm", "flag_ug", "flag_ua", "flag_ae", "flag_gb", "flag_us", "flag_vi", "flag_uy", "flag_uz", "flag_vu", "flag_va", "flag_ve", "flag_vn", "flag_wf", "flag_eh", "flag_ye", "flag_zm", "flag_zw", "flag_re", "flag_ax", "flag_ta", "flag_io", "flag_bq", "flag_cx"
					, "flag_cc", "flag_gg", "flag_im", "flag_yt", "flag_nf", "flag_pn", "flag_bl", "flag_pm", "flag_gs", "flag_tk", "flag_bv", "flag_hm", "flag_sj", "flag_um", "flag_ic", "flag_ea", "flag_cp", "flag_dg", "flag_as", "flag_aq", "flag_vg", "flag_ck", "flag_cw", "flag_eu", "flag_gf", "flag_tf", "flag_gp", "flag_mq", "flag_mp", "flag_sx", "flag_ss", "flag_tc"
                ]
            }

           /* ,queeraz: {
				key: "queeraz",
				type: "custom",
                icon: "queeraz_icon",
                title: "queeraz",
                emoji: [
                    "queeraz_icon", "flag_af", "flag_al", "flag_dz", "flag_ad", "flag_ao", "flag_ai", "flag_ag", "flag_ar", "flag_am", "flag_aw", "flag_au", "flag_at", "flag_az", "flag_bs", "flag_bh", "flag_bd", "flag_bb", "flag_by", "flag_be", "flag_bz", "flag_bj", "flag_bm", "flag_bt", "flag_bo", "flag_ba", "flag_bw", "flag_br", "flag_bn", "flag_bg", "flag_bf", "flag_bi"
                    , "flag_cv", "flag_kh", "flag_cm", "flag_ca", "flag_ky", "flag_cf", "flag_td", "flag_cl", "flag_cn", "flag_co", "flag_km", "flag_cg", "flag_cd", "flag_cr", "flag_hr", "flag_cu", "flag_cy", "flag_cz", "flag_dk", "flag_dj", "flag_dm", "flag_do", "flag_ec", "flag_eg", "flag_sv", "flag_gq", "flag_er", "flag_ee", "flag_et", "flag_fk", "flag_fo"
                    , "flag_fj", "flag_fi", "flag_fr", "flag_pf", "flag_ga", "flag_gm", "flag_ge", "flag_de", "flag_gh", "flag_gi", "flag_gr", "flag_gl", "flag_gd", "flag_gu", "flag_gt", "flag_gn", "flag_gw", "flag_gy", "flag_ht", "flag_hn", "flag_hk", "flag_hu", "flag_is", "flag_in", "flag_id", "flag_ir", "flag_iq", "flag_ie", "flag_il", "flag_it", "flag_ci", "flag_jm", "flag_jp"
                ]
            }
            */
        }
    };
}( jQuery , emojione));
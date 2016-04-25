(function (global, factory) {
	if (typeof module === "object" && typeof module.exports === "object") {
		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get jQuery.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ? factory(global, true) : function (w) {
			if (!w.document) {
				throw new Error("Scroll requires a window with a document");
			}
			if (!w.jQuery) {
				throw new Error('Scroll requires a window with a Jquery');
			}
			return factory(w);
		};
	} else {
		factory(global);
	}
	// Pass this if window is not defined yet
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {
	'use strict';
	var $ = window.jQuery;
	var key = {
		left: 37, up: 38, right: 39, down: 40, spacebar: 32,
		pageup: 33, pagedown: 34, end: 35, home: 36
	};
	var ZScroll = function ($el, options) {
		this.$el = $el;
		this.idx = ++ZScroll.idx;
		this.options = $.extend(true, {}, this.defaults, options);
		$el.data('zscroll', this);
	};
	ZScroll.idx = 0;
	ZScroll.prototype = {
		defaults: {
			/**
			 *  scrollbar min size (height or width)
			 */
			minSize: 50,
			/*
			 scrollbar axis (v and/or h scrollbars)
			 values (string): "y", "x", "yx",'auto'
			 */
			axis: 'auto',
			scrollIncrement: 60,
			/**
			 * open smooth scroll algorithm
			 */
			smoothScrolling: true,
			/*
			 position of scrollbar relative to content
			 values (string): "inside", "outside" (requires elements with not position:static)
			 */
			scrollbarPosition: "inside",
			autoHideScrollbar: true,
			/*
			 mouse-wheel scrolling
			 */
			mouseWheel: {
				/*
				 enable mouse-wheel scrolling
				 values: boolean
				 */
				enable: true,
				/*
				 mouse-wheel scrolling axis
				 the default scrolling direction when both v and h scrollbars are present
				 values (string): "y", "x"
				 */
				axis: "y",
				/*
				 normalize mouse-wheel delta to -1 or 1 (disables mouse-wheel acceleration)
				 values: boolean
				 option						default
				 -------------------------------------
				 normalizeDelta				null
				 */
				/*
				 invert mouse-wheel scrolling direction
				 values: boolean
				 option						default
				 -------------------------------------
				 invert						null
				 */
				/*
				 the tags that disable mouse-wheel when cursor is over them
				 */
				disableOver: ["select", "option", "keygen", "datalist", "textarea"]
			},
			/*
			 keyboard scrolling
			 */
			keyboard: {
				enable: true,
				disableOver: ["select", "option", "keygen", "datalist", "textarea"]
			},
			/*
			 user defined callback functions
			 */
			callbacks: {
				/*
				 Available callbacks:
				 callback					default
				 -------------------------------------
				 onCreate					null
				 onScroll   				null
				 onUpdate					null
				 */
			}
		},
		init: function () {
			var $el = this.$el;
			if (!this.initialized) { /* check if plugin has initialized */
				var scrollBox, scrollContainer,
					scrollBars = [],
					opt = this.options;
				if (opt.axis === 'auto') {
					opt.axis = '';
					if (/auto|scroll/.test($el.css('overflowX'))) {
						opt.axis += 'x';
					}
					if (/auto|scroll/.test($el.css('overflowY'))) {
						opt.axis += 'y';
					}
				}
				if (!opt.axis) { //not axis
					return;
				}
				this.initialized = true;
				$el.wrapInner('<div id="zscroll_' + this.idx + '_container" class="zscroll-container"></div>')
					.wrapInner('<div tabindex=0 id="zscroll_' + this.idx + '_box" class="zscroll-box"></div>');
				scrollBox = $("#zscroll_" + this.idx + '_box');
				scrollContainer = $("#zscroll_" + this.idx + "_container");

				if (~opt.axis.indexOf('x')) {
					scrollBars[0] = $('<div  tabindex=0 id="zscroll_' + this.idx + '_scroll_h" class="zscroll-bar zscroll-bar-h"></div>');
					scrollBars[0].append($('<div class="zscroll-dragger-container"><div class="zscroll-draggerRail"></div><div class="zscroll-dragger"><div class="zscroll-dragger-bar"></div></div></div>'));
				}
				if (~opt.axis.indexOf('y')) {
					scrollBars[1] = $('<div  tabindex=0 id="zscroll_' + this.idx + '_scroll_v" class="zscroll-bar zscroll-bar-v"></div>');
					scrollBars[1].append($('<div class="zscroll-dragger-container"><div class="zscroll-draggerRail"></div><div class="zscroll-dragger"><div class="zscroll-dragger-bar"></div></div></div>'));
				}
				switch (opt.scrollbarPosition) {
					case 'inside':
					case 'outside':
						scrollBars[0] && $el.append(scrollBars[0]);
						scrollBars[1] && $el.append(scrollBars[1]);
						if ($el.css("position") === "static") { /* requires elements with non-static position */
							$el.css("position", "relative");
						}
						break;
				}
				if (opt.autoHideScrollbar) {
					$el.addClass('zscroll-auto-hide')
				} else {
					$el.removeClass('zscroll-auto-hide');
				}
				this.scrollBars = scrollBars;
				this.scrollBox = scrollBox;
				this.scrollContainer = scrollContainer;
				this.initEvent();
				this.options.callbacks.onCreate && this.options.callbacks.onCreate();
				this.update();
				$el.addClass('zscroll');
			} else {
				this.update();
			}
		},
		initEvent: function () {
			var scrollBox = this.scrollBox,
				scrollBars = this.scrollBars;
			this.initBoxEvent(scrollBox);
			scrollBars[0] && scrollBars[0].data('axis', 'x');
			scrollBars[1] && scrollBars[1].data('axis', 'y');
			this.initBarEvent(scrollBars[0]);
			this.initBarEvent(scrollBars[1]);
			var _this = this;
			this.$el.on('over', function () {
				_this.$el.addClass('mouse-over');
			});
			this.$el.on('out', function () {
				_this.$el.removeClass('mouse-over');
			});
			this.$el.on('scrollX', function () {
				_this.options.callbacks.onScroll && _this.options.callbacks.onScroll('x');
			});
			this.$el.on('scrollY', function () {
				_this.options.callbacks.onScroll && _this.options.callbacks.onScroll('y');
			});
		},
		initBoxEvent: function (box) {
			var _this = this;
			box.on('mouseover', function () {
				_this.$el.trigger('over');
			});
			box.on('mouseout', function () {
				if ((_this.scrollBars[0] && !_this.mousedown)
					&& (_this.scrollBars[1] && !_this.mousedown)) {
					_this.$el.trigger('out');
				}
			});
			this.mouseWheel(box);
			this.keydown(box);
		},
		keydown: function ($el) {
			var _this = this;
			this.options.keyboard.enable && $el.on('keydown', function (event) {
				if (~_this.options.keyboard.disableOver.join('').indexOf(event.target.tagName.toLowerCase())) {
					return;
				}
				var scrollIncrement = _this.options.scrollIncrement;
				switch (event.keyCode) {
					case key.left:
						_this.scroll(-scrollIncrement, 'x', event);
						break;
					case key.right:
						_this.scroll(scrollIncrement, 'x', event);
						break;
					case key.up:
						_this.scroll(-scrollIncrement, 'y', event);
						break;
					case key.down:
						_this.scroll(scrollIncrement, 'y', event);
						break;
					case key.spacebar:
						_this.scroll(scrollIncrement * 2, 'y', event);
						break;
					case key.pageup:
						_this.scroll(-scrollIncrement * 3, 'y', event);
						break;
					case key.pagedown:
						_this.scroll(scrollIncrement * 3, 'y', event);
						break;
					case key.end:
						_this.scroll(_this.scrollBox[0].scrollHeight - _this.scrollBox.height(), 'y', event);
						break;
					case key.home:
						_this.scroll(-_this.scrollBox[0].scrollHeight + _this.scrollBox.height(), 'y', event);
						break;
				}
			});
		},
		mouseWheel: function ($el) {
			var mouseWheel = this.options.mouseWheel;
			var _this = this,
				scrollIncrement = _this.options.scrollIncrement;
			if (mouseWheel.enable) {
				$el.on('wheel', function (event) {
					if (~mouseWheel.disableOver.join('').indexOf(event.target.tagName.toLowerCase())) {
						return;
					}
					var deltaY = event.originalEvent.deltaY,
						deltaX = event.originalEvent.deltaX,
						delta, axis = 'y';
					if (event.ctrlKey || event.altKey) {
						return;
					}
					if (deltaY) { //if wheel is y
						deltaY = deltaY / Math.abs(deltaY) * scrollIncrement;
						delta = deltaY;
						//options is x or shiftKey is down to scroll x
						if ((mouseWheel.axis === 'x' && !event.shiftKey) || event.shiftKey) {
							axis = 'x';
						}
						_this.scroll(delta, axis, event);
					} else if (deltaX) {// if wheel is x
						_this.scroll(deltaX / Math.abs(deltaX) * scrollIncrement, 'x', event);
					}
				});
			}
		},
		scroll: function (delta, dir, event) {
			if ((dir === 'x' && this.scrollBars[0] && this.scrollX(delta))
				|| (dir === 'y' && this.scrollBars[1] && this.scrollY(delta))) {
				if (event) {
					event.preventDefault();
				}
			}
		},
		/**
		 * 垂直移动
		 * @param delta
		 * @param drag 是否是拖拽移动
		 * @returns {boolean}
		 */
		scrollY: function (delta, drag) {
			var bv = this.scrollTopSize + delta;
			if ((bv > this.maxScrollTop && this.scrollTopSize === this.maxScrollTop)
				|| (bv < 0 && this.scrollTopSize === 0)) {//end
				return false;
			} else {
				bv = Math.max(bv, 0);
				bv = Math.min(bv, this.maxScrollTop);
				delta = bv - this.scrollTopSize;//get relay delta
				this.scrollTopSize = bv;
				if (drag) {//drag status not smooth scroll
					this.scrollBox.scrollTop(bv);
				} else {
					this.scrollBox.zSmoothScroll({delta: delta, dir: 'y'});
				}
				this.scrollYBar(bv);
				this.$el.trigger('scrollY');
				if (localStorage) {
					localStorage.setItem('zscroll-' + this.idx + 'y', bv);
				}
				return true;
			}
		},
		/**
		 * 横向移动
		 * @param delta
		 * @param drag 是否是拖拽移动
		 * @returns {boolean} 是否移动到末端了
		 */
		scrollX: function (delta, drag) {
			var bv = this.scrollLeftSize + delta;
			if ((bv > this.maxScrollLeft && this.scrollLeftSize === this.maxScrollLeft)
				|| (bv < 0 && this.scrollLeftSize === 0)) {
				return false;
			} else {
				bv = Math.max(bv, 0);
				bv = Math.min(bv, this.maxScrollLeft);
				delta = bv - this.scrollLeftSize;
				this.scrollLeftSize = bv;
				if (drag) {
					this.scrollBox.scrollLeft(bv);
				} else {
					this.scrollBox.zSmoothScroll({delta: delta, dir: 'x'});
				}
				this.scrollXBar(bv);
				this.$el.trigger('scrollX');
				if (localStorage) {
					localStorage.setItem('zscroll-' + this.idx + 'x', bv);
				}
				return true;
			}
		},
		scrollXBar: function (v) {
			var dragger = this.scrollBars[0].find('.zscroll-dragger');
			dragger.css('left', this.w_ratio * v);
		},
		scrollYBar: function (v) {
			var dragger = this.scrollBars[1].find('.zscroll-dragger');
			dragger.css('top', this.h_ratio * v);
		},
		initBarEvent: function (bar) {
			if (bar) {
				var _this = this;
				this.mouseWheel(bar);
				this.keydown(bar);
				bar.on('mouseover', function () {
					_this.$el.trigger('over');
				});
				bar.on('mouseout', function () {
					if (!_this.mousedown) {
						_this.$el.trigger('out');
					}
				});
				bar.on('click', function (event) { //点击滚动槽，移动滚动条
					if (/zscroll-draggerRail/.test(event.target.className)) {
						var t, dragger;
						switch (bar.data('axis')) {
							case 'x':
								dragger = bar.find('.zscroll-dragger');
								t = event.offsetX -
									( dragger.offset().left - dragger.offsetParent().offset().left)
									- dragger.width() / 2;
								t && _this.scrollX(t / _this.w_ratio);
								break;
							case 'y':
								dragger = bar.find('.zscroll-dragger');
								t = event.offsetY -
									( dragger.offset().top - dragger.offsetParent().offset().top)
									- dragger.height() / 2;
								t && _this.scrollY(t / _this.h_ratio);
								break;
						}
					}
				});
				bar.on('mousedown', function (event) {
					_this.$el.trigger('over');
					if (/zscroll-dragger-bar/.test(event.target.className)) { //拖动滚动条
						_this.mousedown = true;
						bar.data('xy', [event.pageX, event.pageY]);
						bar.addClass('mouse-down');
						bar.addClass('mouse-move');
						_this.$el.addClass('scrolling');
					} else {
						bar.removeData('xy');
					}
				});
				bar.on('relaymouseup', function () {
					bar.removeClass('mouse-down');
					bar.removeClass('mouse-move');
					bar.removeData('xy');
					_this.mousedown = false;
					_this.$el.removeClass('scrolling');
				});
				$(document).on('mousemove', function (event) {
					var n_xy = [event.pageX, event.pageY],
						o_xy = bar.data('xy'),
						t;
					if (o_xy) {
						bar.data('xy', n_xy);
						switch (bar.data('axis')) {
							case 'x':
								t = (n_xy[0] - o_xy[0]);
								t && _this.scrollX(t / _this.w_ratio, true);
								break;
							case 'y':
								t = (n_xy[1] - o_xy[1]);
								t && _this.scrollY(t / _this.h_ratio, true);
								break;
						}
					}
				});
				$(document).on('mouseup', function (event) {
					if ($(event.target).parents('.zscroll').length == 0) {
						_this.$el.trigger('out');
					}
					bar.trigger('relaymouseup');
				});
			}
		},
		update: function () {
			var $el = this.$el,
				scrollBox = this.scrollBox,
				scrollBars = this.scrollBars,
				scrollContainer = this.scrollContainer,
				c_width, c_height, b_width, b_height;
			$el.css('overflow', 'visible');
			/* css flexbox fix, detect/set max-height */
			/*	scrollBox.css({
			 "max-height": "none",
			 'max-width': 'none'
			 });*/
			if (scrollBox.height() !== $el.height()) {
				scrollBox.css("max-height", $el.height());
			}
			if (scrollBox.width() !== $el.width()) {
				scrollBox.css('max-width', $el.width());
			}
			c_width = scrollContainer.width();
			c_height = scrollContainer.height();
			b_width = scrollBox.width();
			b_height = scrollBox.height();
			this.maxScrollTop = scrollBox[0].scrollHeight - scrollBox.height();
			this.maxScrollLeft = scrollBox[0].scrollWidth - scrollBox.width();
			this.scrollTopSize = scrollBox.scrollTop();
			this.scrollLeftSize = scrollBox.scrollLeft();
			var offset = 0;
			if (scrollBars[0]) {
				offset = 0;
				if (scrollBars[1]
					&& !scrollBars[1].hasClass('hide')
					&& this.options.scrollbarPosition === 'inside') {
					//has v bar need offset
					offset = scrollBars[1].find('.zscroll-dragger-container').width(); //横向滚动条高度作为偏移量
				}
				var w_ratio = b_width / c_width;
				var w4 = scrollBars[0].width() - offset;//bar width
				var w3 = Math.max(w_ratio * w4, this.options.minSize);// dragger width
				scrollBars[0].width(w4);
				scrollBars[0].find('.zscroll-dragger').width(w3);
				if (c_width <= b_width) {//hide the bar
					scrollBars[0].addClass('hide');
					this.w_ratio = 1;
				} else {
					this.w_ratio = (w4 - w3) / (c_width - b_width);
				}
				if (this.options.scrollbarPosition === 'outside') {
					scrollBars[0].css('bottom', -scrollBars[0].find('.zscroll-dragger-container').height());
				}
				if (localStorage && localStorage.getItem('zscroll-' + this.idx + 'x')) {
					this.scrollX(localStorage.getItem('zscroll-' + this.idx + 'x'), true);
				} else {
					this.scrollXBar(scrollBox.scrollLeft());//restore scroll position
				}
			}
			if (scrollBars[1]) {
				offset = 0;
				if (scrollBars[0]
					&& !scrollBars[0].hasClass('hide')
					&& this.options.scrollbarPosition === 'inside') {
					//has h bar need offset
					offset = scrollBars[0].find('.zscroll-dragger-container').height(); //横向滚动条高度作为偏移量
				}
				var h_ratio = b_height / c_height;
				scrollBars[1].height('');
				var h4 = scrollBars[1].height() - offset; //bar height
				var h3 = Math.max(h_ratio * h4, this.options.minSize);//dragger height

				scrollBars[1].height(h4);
				scrollBars[1].find('.zscroll-dragger').height(h3);
				if (c_height <= b_height) {//hide the bar
					scrollBars[1].addClass('hide');
					this.h_ratio = 1;
				} else {
					this.h_ratio = (h4 - h3) / (c_height - b_height);
				}
				if (this.options.scrollbarPosition === 'outside') {
					scrollBars[1].css('right', -scrollBars[1].find('.zscroll-dragger-container').width());
				}
				if (localStorage && localStorage.getItem('zscroll-' + this.idx + 'y')) {
					this.scrollY(localStorage.getItem('zscroll-' + this.idx + 'y'), true);
				} else {
					this.scrollYBar(scrollBox.scrollTop());//restore scroll position
				}
			}
		}
	};
	var createScroll = function ($el, options) {
		if (!$el.data('zscroll')) {
			return new ZScroll($el, options);
		} else {
			return $el.data('zscroll');
		}
	};
	$.fn.zScroll = function (options) {
		this.each(function () {
			createScroll($(this), options).init();
		})
	};
	/**
	 * @param x
	 * @param y
	 */
	$.fn.zScrollTo = function (x, y) {
		this.each(function () {
			var zscroll = $(this).data('zscroll');
			if (!zscroll) {
				throw 'this dom have not zscroll object';
			}
			if (x !== undefined) {
				zscroll.scrollX(x - zscroll.scrollBox.scrollLeft());
			}
			if (y !== undefined) {
				zscroll.scrollY(y - zscroll.scrollBox.scrollTop());
			}
		});

	}
});
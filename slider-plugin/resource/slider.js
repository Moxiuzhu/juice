// 自调用匿名函数
(function(win, doc, $){
	// 创建构造函数
	function CusScrollBar(options){
		this._init(options)
	}
	// 添加静态方法
	$.extend(CusScrollBar.prototype, {
		_init: function(options){
			var self = this;
			self.options = {
				scrollDir: "y", // 滚动方向
				contSelector: "", //滚动内容区选择器
				barSelector: "", //滚动条选择器
				sliderSelector: "", //滚动滑块儿选择器
				wheelStep: 10, //鼠标滚动步长
				tabItemSelector: ".tab-item", //标签选择器
				tabActiveItem: "tab-active", //选中标签类名
				anchorSelector: '.anchor', //锚点选择器
				correctSelector: '.correct-bot', // 矫正元素
				articleSelector: '.scroll-ol' //文章选择器

			}
			$.extend(true, self.options, options || {});
			
			self._initDomEvent();
			return self;
		},
		/**
		 *初始化DOM引用
		 */
		_initDomEvent: function(){
			var ops = this.options;
			// 滚动内容区对象
			this.$cont = $(ops.contSelector);
			// 滚动条滑块对象
			this.$slider = $(ops.sliderSelector);
			// 滚动条对象
			this.$bar = ops.barSelector ? $(ops.barSelector) : self.$slider.parent();
			// 获取文档对象
			this.$doc = $(doc);
			// 获取标签项
			this.$tabItem = $(ops.tabItemSelector);
			// 锚点
			this.$anchor = $(ops.anchorSelector);
			// 正文
	      	this.$article = $(ops.articleSelector);
	      	// 矫正元素对象
	      	this.$correct = $(ops.correctSelector);

			this._initSliderDragEvent()
				._bindContScroll()
				._bindMousewheel()
				._initTabEvent()
				._initAriticleHeight();
		},
		/**
	     * 初始化滑块拖动功能
	     * @return {[Object]} [this]
	     */
	    _initSliderDragEvent: function() {
	      var slider = this.$slider,
	        sliderEl = slider[0],
	        self = this;
	      if (sliderEl) {
	        var doc = this.$doc,
	          dragStartPagePosition,
	          dragStartScrollPosition,
	          dragContBarRate;

	        function mousemoveHandler(e) {
	          e.preventDefault();
	          console.log('mousemove');
	          if (dragStartPagePosition == null) return;
	          self.scrollTo(
	            dragStartScrollPosition +
	              (e.pageY - dragStartPagePosition) * dragContBarRate
	          );
	        }
	        slider.on('mousedown', function(e) {
	          e.preventDefault();
	          console.log('mousedown');
	          dragStartPagePosition = e.pageY;
	          // console.log(self.$cont)
	          dragStartScrollPosition = self.$cont[0].scrollTop;
	          dragContBarRate =
	            self.getMaxScrollPosition() / self.getMaxSliderPosition();
	          doc
	            .on('mousemove.scroll', mousemoveHandler)
	            .on('mouseup.scroll', function(e) {
	              console.log('mouseup');
	              doc.off('.scroll');
	            });
	        });
	      }
	      return self;
	    },
	    /**
			初始化标签切换功能
	    */
	    _initTabEvent: function(){
	    	var self = this;
	    	self.$tabItem.on('click', function(e){
	    		e.preventDefault();
	    		var index = $(this).index();
	    		self.changeTabSelect(index);
	    		// 已经滚出可视区的内容高度 + 指定锚点与内容容器的距离
	    		self.scrollTo(self.$cont[0].scrollTop + self.getAnchorPosition(index))
	    	})
	    	return self;
	    },
	    /**
			初始化文档高度
	    */
	    _initAriticleHeight: function(){
	    	var self = this,
		        lastArticle = self.$article.last();
		    var lastArticleHeight = lastArticle.height(),
		        contHeight = self.$cont.height();
		    if (lastArticleHeight < contHeight) {
		        self.$correct[0].style.height =
		          contHeight - lastArticleHeight - self.$anchor.outerHeight() + 'px';
		    }
		    return self;
	    },
	    // 监听内容的滚动，同步滑块的位置
	    _bindContScroll: function(){
	    	var self = this;
	    	self.$cont.on('scroll', function(e){
	    		var sliderEl = self.$slider && self.$slider[0];
	    		if(sliderEl){
	    			sliderEl.style.top = self.getSliderPosition() + 'px';
	    		}
	    	})
	    	return self;
	    },
	    // 监听鼠标滚轮事件
	    _bindMousewheel: function(){
	    	var self = this;
	    	self.$cont.on('mousewheel DOMMouseScroll', function(e){
	    		e.preventDefault();
	    		var oEv = e.originalEvent,
	    			wheelRange = oEv.wheelDelta
	    				? -oEv.wheelDelta / 120
	    				: (oEv.detail || 0) /3
	    		self.scrollTo(
	    			self.$cont[0].scrollTop + wheelRange * self.options.wheelStep
	    		); 
	    	});
	    	return self;
	    },
	    // 切换标签选中
	    changeTabSelect: function(index){
	    	var self = this,
	    		active = self.options.tabActiveItem;
	    	return self.$tabItem
	    		.eq(index)
	    		.addClass(active)
	    		.siblings()
	    		.removeClass(active);
	    },
	    // 指定锚点到上边界的像素数
	    getAnchorPosition: function(index){
	    	return this.$anchor.eq(index).position().top;
	    },
	    // 获取每个锚点位置信息的数组
	    getAllAnchorPosition: function(){
	    	var self = this,
	    		allPositionArr = [];
	    	for(var i = 0; i < self.$anchor.length; i++){
	    		allPositionArr.push(
	    			self.$cont[0].scrollTop + self.getAnchorPosition(i)
	    		)
	    	}
	    	return allPositionArr;
	    },
	    // 返回滑块当前的位置
	    getSliderPosition: function(){
	    	var self = this,
	    		maxSliderPosition = self.getMaxSliderPosition();
	    	// 滑块移动距离 = 滑块可移动高度 * 内容移动高度 / 内容可移动的高度
	    	return Math.min(
	    		maxSliderPosition,
	    		maxSliderPosition * 
	    		self.$cont[0].scrollTop / 
	    		self.getMaxScrollPosition()
	    	)
	    },
		// 内容可滚动的高度
	    getMaxScrollPosition: function() {
	      var self = this;
	      return (
	        Math.max(self.$cont.height(), self.$cont[0].scrollHeight) -
	        self.$cont.height()
	      );
	    },
	    // 滑动可移动的距离
	    getMaxSliderPosition: function() {
	      var self = this;
	      return self.$bar.height() - self.$slider.height();
	    },
		// 滚动到哪个位置
		scrollTo: function(positionVal){
			var self = this;
			var posArr = self.getAllAnchorPosition();
			
			// 滚动条的位置和tab标签的对应
			function getIndex(positionVal){
				for(var i = posArr.length - 1; i >= 0; i--){
					if(positionVal >= posArr[i]){
						return i;
					}else{
						continue;
					}
				}
			}
			// 锚点数和标签数相同
			if(posArr.length === self.$tabItem.length){
				self.changeTabSelect(getIndex(positionVal));
			}
			self.$cont.scrollTop(positionVal);
		}
	});
	// 原型
	// CusScrollBar.prototype._init = function(){
	// 	console.log('test...')
	// }
	win.CusScrollBar = CusScrollBar;
})(window, document, jQuery);
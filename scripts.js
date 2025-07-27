document.addEventListener('DOMContentLoaded', function() {
    // 导航相关功能
    initNavigation();
    
    // VLM选择器功能
    initVLMSelector();
    
    // 视频控制功能
    initVideoControls();
    
    // 设置视频播放速度
    initVideoPlaybackRate();
});

// 导航功能
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.major-section');
    
    // 导航点击事件
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // 移除所有active类
                navItems.forEach(nav => nav.classList.remove('active'));
                // 添加active类到当前项
                this.classList.add('active');
                
                // 平滑滚动到目标区域
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // 滚动监听，自动更新导航状态
    function updateActiveNav() {
        const scrollPosition = window.scrollY + 100; // 偏移量
        
        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navItems.forEach(nav => nav.classList.remove('active'));
                if (navItems[index]) {
                    navItems[index].classList.add('active');
                }
            }
        });
    }
    
    // 监听滚动事件
    window.addEventListener('scroll', updateActiveNav);
    
    // 初始化
    updateActiveNav();
}

// VLM选择器功能
function initVLMSelector() {
    const vlmSelector = document.getElementById('vlm-selector');
    const claudeEpisode = document.getElementById('claude-episode-0');
    const geminiEpisode = document.getElementById('gemini-episode-0');
    const taskItems = document.querySelectorAll('.task-item');

    // 调试信息
    console.log('VLM Selector:', vlmSelector);
    console.log('Claude Episode:', claudeEpisode);
    console.log('Gemini Episode:', geminiEpisode);
    console.log('Task Items:', taskItems);

    if (!vlmSelector) {
        console.error('找不到VLM选择器');
        return;
    }

    if (!claudeEpisode || !geminiEpisode) {
        console.error('找不到episode元素:', {
            claudeEpisode: !!claudeEpisode,
            geminiEpisode: !!geminiEpisode
        });
        return;
    }

    // 初始状态：显示Claude episode，隐藏Gemini episode
    if (claudeEpisode) claudeEpisode.style.display = 'block';
    if (geminiEpisode) geminiEpisode.style.display = 'none';

    // VLM选择器变化事件
    vlmSelector.addEventListener('change', function() {
        const selectedVLM = this.value;
        console.log('选择的VLM:', selectedVLM);
        
        if (selectedVLM === 'claude') {
            if (claudeEpisode) claudeEpisode.style.display = 'block';
            if (geminiEpisode) geminiEpisode.style.display = 'none';
            
            // 更新任务选择器
            taskItems.forEach(item => item.classList.remove('selected'));
            const claudeTask = document.querySelector('[data-episode="claude-success"]');
            if (claudeTask) {
                claudeTask.classList.add('selected');
            }
        } else if (selectedVLM === 'gemini') {
            if (claudeEpisode) claudeEpisode.style.display = 'none';
            if (geminiEpisode) geminiEpisode.style.display = 'block';
            
            // 更新任务选择器
            taskItems.forEach(item => item.classList.remove('selected'));
            const geminiTask = document.querySelector('[data-episode="gemini-failure"]');
            if (geminiTask) {
                geminiTask.classList.add('selected');
            }
        }
    });

    // 任务选择器点击事件
    taskItems.forEach(item => {
        item.addEventListener('click', function() {
            const episode = this.dataset.episode;
            console.log('点击的任务:', episode);
            
            // 移除所有选中状态
            taskItems.forEach(task => task.classList.remove('selected'));
            // 添加当前选中状态
            this.classList.add('selected');
            
            if (episode === 'claude-success') {
                vlmSelector.value = 'claude';
                if (claudeEpisode) claudeEpisode.style.display = 'block';
                if (geminiEpisode) geminiEpisode.style.display = 'none';
            } else if (episode === 'gemini-failure') {
                vlmSelector.value = 'gemini';
                if (claudeEpisode) claudeEpisode.style.display = 'none';
                if (geminiEpisode) geminiEpisode.style.display = 'block';
            }
        });
    });
}

// 视频控制功能
function initVideoControls() {
    const videos = document.querySelectorAll('.control-video');
    
    videos.forEach(video => {
        const container = video.closest('.video-container');
        if (!container) return;
        
        const playButton = container.querySelector('.play-button');
        const speedSelector = container.querySelector('.speed-selector');
        
        // 如果没有控制按钮，跳过此视频（自动播放的视频）
        if (!playButton || !speedSelector) return;
        
        // 播放/暂停功能
        playButton.addEventListener('click', function() {
            if (video.paused || video.ended) {
                video.play();
                playButton.textContent = 'Pause';
            } else {
                video.pause();
                playButton.textContent = 'Play';
            }
        });
        
        // 速度控制功能
        speedSelector.addEventListener('change', function() {
            video.playbackRate = parseFloat(this.value);
        });
        
        // 视频结束后重置按钮
        video.addEventListener('ended', function() {
            playButton.textContent = 'Play';
        });
        
        // 点击视频本身也能播放/暂停
        video.addEventListener('click', function() {
            if (video.paused || video.ended) {
                video.play();
                playButton.textContent = 'Pause';
            } else {
                video.pause();
                playButton.textContent = 'Play';
            }
        });
    });
}

// 设置自动播放视频的播放速度
function initVideoPlaybackRate() {
    // 设置所有控制视频的播放速度为1.8倍
    const controlVideos = document.querySelectorAll('.control-video');
    controlVideos.forEach(video => {
        // 检查是否有autoplay属性，如果有则设置播放速度
        if (video.hasAttribute('autoplay')) {
            video.playbackRate = 1.0; // 设置为1.0倍速

            // 确保视频能够自动播放
            video.addEventListener('loadeddata', function() {
                this.playbackRate = 1.0; // 再次确保播放速度
            });
        }
    });
}
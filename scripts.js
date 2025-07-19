// scripts.js

// 等待DOM内容加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 为展开/折叠功能添加事件处理（如果需要自定义行为）
    const expandables = document.querySelectorAll('.expandable');
    expandables.forEach(expandable => {
        const summary = expandable.querySelector('summary');
        summary.addEventListener('click', function() {
            // 可以在此处添加额外的逻辑，例如动画效果
        });
    });

    // 为任务项添加点击事件（如果需要支持多个任务切换）
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除其他任务项的选中状态
            taskItems.forEach(i => i.classList.remove('selected'));
            // 为当前点击的任务项添加选中状态
            this.classList.add('selected');
            
            // 这里可以添加加载对应任务内容的逻辑
        });
    });

    // 添加下拉选择框的事件处理
    const controlSelects = document.querySelectorAll('.control-select');
    controlSelects.forEach(select => {
        select.addEventListener('change', function() {
            // 根据选择更新聊天内容
            // 例如，切换机器人类型或查询模式时重新加载示例
        });
    });
});
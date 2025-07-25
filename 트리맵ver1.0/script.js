// 원본 데이터 - 20개 항목
let data = [
    { name: 'A', value: 20 },
    { name: 'B', value: 9 },
    { name: 'C', value: 8 },
    { name: 'D', value: 4 },
    { name: 'E', value: 3 },
    { name: 'F', value: 18 },
    { name: 'G', value: 10 },
    { name: 'H', value: 16 },
    { name: 'I', value: 6 },
    { name: 'J', value: 4 },
    { name: 'K', value: 10 },
    { name: 'L', value: 6 },
    { name: 'M', value: 15 },
    { name: 'N', value: 4 },
    { name: 'O', value: 6 },
    { name: 'P', value: 6 },
    { name: 'Q', value: 8 },
    { name: 'R', value: 3 },
    { name: 'S', value: 15 },
    { name: 'T', value: 2 }
];

// 설정 - 반응형 padding
function getPadding() {
    const container = document.querySelector('.treemap-container');
    const rect = container.getBoundingClientRect();
    // 컨테이너 크기에 따라 padding 조정
    const minPadding = 10;
    const maxPadding = 30;
    const scale = Math.min(rect.width, rect.height) / 1000; // 1000px 기준으로 스케일
    return Math.max(minPadding, Math.min(maxPadding, 20 * scale));
}

function getContainerSize() {
    const container = document.querySelector('.treemap-container');
    const rect = container.getBoundingClientRect();
    return {
        width: rect.width,
        height: rect.height
    };
}

// 색상 정의 - 단계별 색상 배열
const stageColors = [
    '#3498db', // 1단계 - 파란색
    '#e67e22', // 2단계 - 주황색
    '#2ecc71', // 3단계 - 초록색
    '#9b59b6', // 4단계 - 보라색
    '#f1c40f', // 5단계 - 노란색
    '#e74c3c', // 6단계 - 빨간색
    '#1abc9c', // 7단계 - 청록색
    '#34495e', // 8단계 - 어두운 회색
    '#f39c12', // 9단계 - 주황색
    '#16a085', // 10단계 - 어두운 청록색
    '#8e44ad', // 11단계 - 어두운 보라색
    '#27ae60', // 12단계 - 어두운 초록색
    '#d35400', // 13단계 - 어두운 주황색
    '#c0392b', // 14단계 - 어두운 빨간색
    '#7f8c8d', // 15단계 - 회색
    '#95a5a6'  // 16단계 - 밝은 회색
];

// 툴팁 생성
const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

// SVG 생성 - 반응형 크기로 설정
const svg = d3.select('#treemap')
    .append('svg')
    .attr('width', '100%')  // 컨테이너 크기에 맞춤
    .attr('height', '100%');

// 재귀적 Treemap 생성 함수
function createRecursiveTreemap(data, width, height) {
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const totalValue = d3.sum(sortedData, d => d.value);
    
    const padding = getPadding();
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;
    
    const rectangles = [];
    let remainingData = [...sortedData];
    let iteration = 1;
    
    // 사용되지 않은 영역들을 추적 (전체 컨테이너에서 시작)
    let unusedAreas = [{
        x: padding,
        y: padding,
        width: availableWidth,
        height: availableHeight
    }];
    
    while (remainingData.length > 2) {
        const currentTotal = d3.sum(remainingData, d => d.value);
        
        // 1단계: 누적합 40% 이하 (최소 1개 보장)
        let stage1Items = [];
        let cumulativeSum = 0;
        let stage1Threshold = currentTotal * 0.4;
        
        if (remainingData.length > 0) {
            stage1Items.push(remainingData[0]);
            cumulativeSum = remainingData[0].value;
            
            for (let i = 1; i < remainingData.length; i++) {
                if (cumulativeSum + remainingData[i].value <= stage1Threshold) {
                    stage1Items.push(remainingData[i]);
                    cumulativeSum += remainingData[i].value;
                } else {
                    break;
                }
            }
        }
        
        // 2단계: 남은 항목 중 40% 이하 (최소 1개 보장)
        const stage2Candidates = remainingData.filter(item => 
            !stage1Items.some(stage1Item => stage1Item.name === item.name)
        );
        
        let stage2Items = [];
        if (stage2Candidates.length > 0) {
            const stage2Total = d3.sum(stage2Candidates, d => d.value);
            let stage2Threshold = stage2Total * 0.4;
            
            stage2Items.push(stage2Candidates[0]);
            cumulativeSum = stage2Candidates[0].value;
            
            for (let i = 1; i < stage2Candidates.length; i++) {
                if (cumulativeSum + stage2Candidates[i].value <= stage2Threshold) {
                    stage2Items.push(stage2Candidates[i]);
                    cumulativeSum += stage2Candidates[i].value;
                } else {
                    break;
                }
            }
        }
        
        // 홀수 단계: 사용되지 않은 영역 중 가장 큰 영역을 가로로 6:4 나누어 오른쪽 40% 사용
        if (stage1Items.length > 0) {
            // 사용되지 않은 영역 중 가장 큰 영역 선택
            const largestArea = unusedAreas.reduce((largest, area) => 
                area.width * area.height > largest.width * largest.height ? area : largest
            );
            
            // 해당 영역을 가로로 6:4 나누어 오른쪽 40% 사용
            const stage1Width = largestArea.width * 0.4;
            const stage1X = largestArea.x + largestArea.width * 0.6;
            const stage1Height = largestArea.height;
            const stage1Total = d3.sum(stage1Items, d => d.value);
            
            // 값이 큰 순서대로 위에서 아래로 배치
            let itemY = largestArea.y;
            for (let item of stage1Items) {
                const itemHeight = (item.value / stage1Total) * stage1Height;
                
                rectangles.push({
                    name: item.name,
                    value: item.value,
                    x: stage1X + 2,
                    y: itemY + 2,
                    width: stage1Width - 4,
                    height: itemHeight - 4,
                    color: stageColors[iteration - 1] || stageColors[stageColors.length - 1],
                    stage: iteration
                });
                
                itemY += itemHeight;
            }
            
            // 사용되지 않은 영역 업데이트: 가장 큰 영역을 왼쪽 60%로 교체
            const areaIndex = unusedAreas.indexOf(largestArea);
            unusedAreas[areaIndex] = {
                x: largestArea.x,
                y: largestArea.y,
                width: largestArea.width * 0.6,
                height: largestArea.height
            };
        }
        
        // 짝수 단계: 사용되지 않은 영역 중 가장 큰 영역을 세로로 6:4 나누어 상단 40% 사용
        if (stage2Items.length > 0) {
            // 사용되지 않은 영역 중 가장 큰 영역 선택
            const largestArea = unusedAreas.reduce((largest, area) => 
                area.width * area.height > largest.width * largest.height ? area : largest
            );
            
            // 해당 영역을 세로로 6:4 나누어 상단 40% 사용
            const stage2Width = largestArea.width;
            const stage2Height = largestArea.height * 0.4;
            const stage2X = largestArea.x;
            const stage2Y = largestArea.y;
            const stage2Total = d3.sum(stage2Items, d => d.value);
            
            // 값이 큰 순서대로 우측에서 좌측으로 배치
            let currentX = stage2X + stage2Width;
            for (let item of stage2Items) {
                const itemWidth = (item.value / stage2Total) * stage2Width;
                currentX -= itemWidth; // 좌측으로 이동
                
                rectangles.push({
                    name: item.name,
                    value: item.value,
                    x: currentX + 2,
                    y: stage2Y + 2,
                    width: itemWidth - 4,
                    height: stage2Height - 4,
                    color: stageColors[iteration] || stageColors[stageColors.length - 1],
                    stage: iteration + 1
                });
            }
            
            // 사용되지 않은 영역 업데이트: 가장 큰 영역을 하단 60%로 교체
            const areaIndex = unusedAreas.indexOf(largestArea);
            unusedAreas[areaIndex] = {
                x: largestArea.x,
                y: largestArea.y + largestArea.height * 0.4,
                width: largestArea.width,
                height: largestArea.height * 0.6
            };
        }
        
        // 배치된 항목들 제거
        const placedItems = [...stage1Items, ...stage2Items];
        remainingData = remainingData.filter(item => 
            !placedItems.some(placedItem => placedItem.name === item.name)
        );
        
        iteration += 2; // 다음 단계는 +2
    }
    
    // 남은 1~2개 항목을 최종 영역에 배치
    if (remainingData.length > 0) {
        // 사용되지 않은 영역 중 가장 큰 영역 선택
        const largestArea = unusedAreas.reduce((largest, area) => 
            area.width * area.height > largest.width * largest.height ? area : largest
        );
        
        // squarify 알고리즘 사용
        const treemap = d3.treemap()
            .size([largestArea.width - 4, largestArea.height - 4])
            .padding(2);
        
        const root = d3.hierarchy({ children: remainingData })
            .sum(d => d.value);
        
        treemap(root);
        
        root.leaves().forEach(leaf => {
            rectangles.push({
                name: leaf.data.name,
                value: leaf.data.value,
                x: largestArea.x + 2 + leaf.x0,
                y: largestArea.y + 2 + leaf.y0,
                width: leaf.x1 - leaf.x0,
                height: leaf.y1 - leaf.y0,
                color: stageColors[stageColors.length - 1], // 마지막 색상
                stage: 'final'
            });
        });
    }
    
    return rectangles;
}

// 트리맵 렌더링
function renderTreemap() {
    // 컨테이너 크기 동적 측정
    const { width, height } = getContainerSize();
    
    // SVG 크기를 컨테이너에 맞춤 (약간의 여유 공간 추가)
    svg.attr('width', width).attr('height', height);
    
    // 기존 요소 제거
    svg.selectAll('*').remove();
    // 사각형 생성
    const rectangles = createRecursiveTreemap(data, width, height);
    // 사각형 그리기
    const nodes = svg.selectAll('.node')
        .data(rectangles)
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x}, ${d.y})`);
    // 사각형 배경
    nodes.append('rect')
        .attr('width', d => d.width)
        .attr('height', d => d.height)
        .attr('fill', d => d.color)
        .attr('rx', 4)
        .attr('ry', 4);
    // 텍스트 추가 (박스 크기에 따라 조건부 표시)
    nodes.append('text')
        .attr('class', 'node-text node-name')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height / 2 - 6)
        .text(d => d.name)
        .style('font-size', d => Math.min(d.width / 8, d.height / 4, 12) + 'px');
    nodes.append('text')
        .attr('class', 'node-text node-value')
        .attr('x', d => d.width / 2)
        .attr('y', d => d.height / 2 + 6)
        .text(d => d.value)
        .style('font-size', d => Math.min(d.width / 10, d.height / 5, 10) + 'px');
    // 마우스 이벤트
    nodes.on('mouseover', function(event, d) {
        d3.select(this).select('rect')
            .transition()
            .duration(200)
            .attr('opacity', 0.8);
        tooltip.transition()
            .duration(200)
            .style('opacity', 1);
        tooltip.html(`
            <strong>${d.name}</strong><br/>
            Value: ${d.value}<br/>
            단계: ${d.stage}단계<br/>
            순위: ${data.sort((a, b) => b.value - a.value).findIndex(item => item.name === d.name) + 1}위
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
        d3.select(this).select('rect')
            .transition()
            .duration(200)
            .attr('opacity', 1);
        tooltip.transition()
            .duration(200)
            .style('opacity', 0);
    });
    // 통계 업데이트
    updateStats();
}

// 통계 업데이트
function updateStats() {
    const totalValue = d3.sum(data, d => d.value);
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    
    // 순차적 단계별 항목 수 계산
    let remainingData = [...sortedData];
    let stageCounts = {};
    let iteration = 1;
    
    while (remainingData.length > 2) {
        const currentTotal = d3.sum(remainingData, d => d.value);
        
        // 첫 번째 항목들 계산
        let stage1Items = [];
        let cumulativeSum = 0;
        let stage1Threshold = currentTotal * 0.4;
        
        if (remainingData.length > 0) {
            stage1Items.push(remainingData[0]);
            cumulativeSum = remainingData[0].value;
            
            for (let i = 1; i < remainingData.length; i++) {
                if (cumulativeSum + remainingData[i].value <= stage1Threshold) {
                    stage1Items.push(remainingData[i]);
                    cumulativeSum += remainingData[i].value;
                } else {
                    break;
                }
            }
        }
        
        // 두 번째 항목들 계산
        const stage2Candidates = remainingData.filter(item => 
            !stage1Items.some(stage1Item => stage1Item.name === item.name)
        );
        
        let stage2Items = [];
        if (stage2Candidates.length > 0) {
            const stage2Total = d3.sum(stage2Candidates, d => d.value);
            let stage2Threshold = stage2Total * 0.4;
            
            stage2Items.push(stage2Candidates[0]);
            cumulativeSum = stage2Candidates[0].value;
            
            for (let i = 1; i < stage2Candidates.length; i++) {
                if (cumulativeSum + stage2Candidates[i].value <= stage2Threshold) {
                    stage2Items.push(stage2Candidates[i]);
                    cumulativeSum += stage2Candidates[i].value;
                } else {
                    break;
                }
            }
        }
        
        // 단계별 카운트 저장
        stageCounts[iteration] = stage1Items.length;
        stageCounts[iteration + 1] = stage2Items.length;
        
        // 배치된 항목들 제거
        const placedItems = [...stage1Items, ...stage2Items];
        remainingData = remainingData.filter(item => 
            !placedItems.some(placedItem => placedItem.name === item.name)
        );
        
        iteration += 2; // 다음 단계는 +2
    }
    
    // 최종 남은 항목들
    const finalCount = remainingData.length;
    
    document.getElementById('total-value').textContent = totalValue;
    document.getElementById('stage1-count').textContent = stageCounts[1] || 0;
    document.getElementById('stage2-count').textContent = stageCounts[2] || 0;
    document.getElementById('stage3-count').textContent = finalCount;
    
    // 단계별 항목 상세 정보 업데이트
    updateStageDetails(sortedData, stage1Count, stage2Count);
}

// 단계별 항목 상세 정보 업데이트
function updateStageDetails(sortedData, stage1Count, stage2Count) {
    // 재귀적 방식으로 단계별 항목 수집
    let remainingData = [...sortedData];
    let stage1Items = [];
    let stage2Items = [];
    let iteration = 1;
    
    while (remainingData.length > 2) {
        const currentTotal = d3.sum(remainingData, d => d.value);
        
        // 1단계 계산
        let currentStage1Items = [];
        let cumulativeSum = 0;
        let stage1Threshold = currentTotal * 0.4;
        
        if (remainingData.length > 0) {
            currentStage1Items.push(remainingData[0]);
            cumulativeSum = remainingData[0].value;
            
            for (let i = 1; i < remainingData.length; i++) {
                if (cumulativeSum + remainingData[i].value <= stage1Threshold) {
                    currentStage1Items.push(remainingData[i]);
                    cumulativeSum += remainingData[i].value;
                } else {
                    break;
                }
            }
        }
        
        // 2단계 계산
        const stage2Candidates = remainingData.filter(item => 
            !currentStage1Items.some(stage1Item => stage1Item.name === item.name)
        );
        
        let currentStage2Items = [];
        if (stage2Candidates.length > 0) {
            const stage2Total = d3.sum(stage2Candidates, d => d.value);
            let stage2Threshold = stage2Total * 0.4;
            
            currentStage2Items.push(stage2Candidates[0]);
            cumulativeSum = stage2Candidates[0].value;
            
            for (let i = 1; i < stage2Candidates.length; i++) {
                if (cumulativeSum + stage2Candidates[i].value <= stage2Threshold) {
                    currentStage2Items.push(stage2Candidates[i]);
                    cumulativeSum += stage2Candidates[i].value;
                } else {
                    break;
                }
            }
        }
        
        stage1Items.push(...currentStage1Items);
        stage2Items.push(...currentStage2Items);
        
        // 배치된 항목들 제거
        const placedItems = [...currentStage1Items, ...currentStage2Items];
        remainingData = remainingData.filter(item => 
            !placedItems.some(placedItem => placedItem.name === item.name)
        );
        
        iteration++;
    }
    
    // 최종 남은 항목들
    const finalItems = remainingData;
    
    // 1단계 항목들 표시
    const stage1Element = document.getElementById('stage1-items');
    if (stage1Items.length > 0) {
        stage1Element.innerHTML = stage1Items.map(item => 
            `<span class="item-tag">${item.name} (${item.value})</span>`
        ).join(' ');
    } else {
        stage1Element.innerHTML = '<span class="no-items">항목 없음</span>';
    }
    
    // 2단계 항목들 표시
    const stage2Element = document.getElementById('stage2-items');
    if (stage2Items.length > 0) {
        stage2Element.innerHTML = stage2Items.map(item => 
            `<span class="item-tag">${item.name} (${item.value})</span>`
        ).join(' ');
    } else {
        stage2Element.innerHTML = '<span class="no-items">항목 없음</span>';
    }
    
    // 최종 항목들 표시
    const stage3Element = document.getElementById('stage3-items');
    if (finalItems.length > 0) {
        stage3Element.innerHTML = finalItems.map(item => 
            `<span class="item-tag">${item.name} (${item.value})</span>`
        ).join(' ');
    } else {
        stage3Element.innerHTML = '<span class="no-items">항목 없음</span>';
    }
}

// 랜덤 데이터 생성
function generateRandomData() {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 
                  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
    
    data = names.map(name => ({
        name: name,
        value: Math.floor(Math.random() * 20) + 1
    }));
    
    renderTreemap();
}

// 원본 데이터 복원
function resetData() {
    data = [
        { name: 'A', value: 20 },
        { name: 'B', value: 9 },
        { name: 'C', value: 8 },
        { name: 'D', value: 4 },
        { name: 'E', value: 3 },
        { name: 'F', value: 18 },
        { name: 'G', value: 10 },
        { name: 'H', value: 16 },
        { name: 'I', value: 6 },
        { name: 'J', value: 4 },
        { name: 'K', value: 10 },
        { name: 'L', value: 6 },
        { name: 'M', value: 15 },
        { name: 'N', value: 4 },
        { name: 'O', value: 6 },
        { name: 'P', value: 6 },
        { name: 'Q', value: 8 },
        { name: 'R', value: 3 },
        { name: 'S', value: 15 },
        { name: 'T', value: 2 }
    ];
    
    renderTreemap();
}

// 화면 크기 변화 감지 및 트리맵 재렌더링
window.addEventListener('resize', () => {
    renderTreemap();
});

// 초기 렌더링
document.addEventListener('DOMContentLoaded', () => {
    renderTreemap();
}); 
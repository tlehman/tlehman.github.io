/**
 * Hypergraph Theory Exploration Tool
 * Interactive visualization and manipulation of hypergraphs
 */

class HypergraphTool {
  constructor() {
    this.canvas = document.getElementById('hypergraph-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.nodes = [];
    this.hyperedges = [];
    this.selectedNodes = new Set();
    this.nextNodeId = 1;
    this.nextHyperedgeId = 1;

    // Visual constants
    this.NODE_RADIUS = 8;
    this.NODE_COLOR = '#4080BF';
    this.NODE_SELECTED_COLOR = '#FFD700';
    this.NODE_HOVER_COLOR = '#60A0DF';
    this.HYPEREDGE_COLORS = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
    ];

    this.hoveredNode = null;
    this.isDragging = false;
    this.draggedNode = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupControls();
    this.loadFromStorage();
    this.updateDataStructure();
    this.render();
  }

  setupEventListeners() {
    // Canvas mouse events
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());

    // Keyboard events
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Copy JSON button
    document.getElementById('copy-json').addEventListener('click', () => this.copyJSONToClipboard());
  }

  setupControls() {
    document.getElementById('clear-all').addEventListener('click', () => this.clearAll());
    document.getElementById('create-hyperedge').addEventListener('click', () => this.createHyperedge());
    document.getElementById('delete-selected').addEventListener('click', () => this.deleteSelected());
    document.getElementById('export-png').addEventListener('click', () => this.exportToPNG());
    document.getElementById('export-svg').addEventListener('click', () => this.exportToSVG());
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  getNodeAt(x, y) {
    return this.nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= this.NODE_RADIUS + 5; // 5px tolerance
    });
  }

  handleCanvasClick(e) {
    if (this.isDragging) return;

    const pos = this.getMousePos(e);
    const clickedNode = this.getNodeAt(pos.x, pos.y);

    if (clickedNode) {
      // Toggle node selection
      if (this.selectedNodes.has(clickedNode.id)) {
        this.selectedNodes.delete(clickedNode.id);
      } else {
        this.selectedNodes.add(clickedNode.id);
      }
    } else {
      // Create new node
      this.createNode(pos.x, pos.y);
    }

    this.updateSelectionUI();
    this.render();
  }

  handleMouseMove(e) {
    const pos = this.getMousePos(e);

    if (this.isDragging && this.draggedNode) {
      this.draggedNode.x = pos.x;
      this.draggedNode.y = pos.y;
      this.saveToStorage();
      this.render();
      return;
    }

    const hoveredNode = this.getNodeAt(pos.x, pos.y);

    if (hoveredNode !== this.hoveredNode) {
      this.hoveredNode = hoveredNode;
      this.canvas.style.cursor = hoveredNode ? 'pointer' : 'crosshair';
      this.render();
    }
  }

  handleMouseDown(e) {
    const pos = this.getMousePos(e);
    const clickedNode = this.getNodeAt(pos.x, pos.y);

    if (clickedNode) {
      this.isDragging = true;
      this.draggedNode = clickedNode;
      this.canvas.style.cursor = 'grabbing';
    }
  }

  handleMouseUp() {
    this.isDragging = false;
    this.draggedNode = null;
    this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'crosshair';
  }

  handleMouseLeave() {
    this.hoveredNode = null;
    this.isDragging = false;
    this.draggedNode = null;
    this.canvas.style.cursor = 'crosshair';
    this.render();
  }

  handleKeyDown(e) {
    switch (e.key.toLowerCase()) {
      case 'h':
        if (this.selectedNodes.size >= 2) {
          this.createHyperedge();
        }
        break;
      case 'c':
        this.clearSelection();
        break;
      case 'delete':
      case 'backspace':
        if (this.selectedNodes.size > 0) {
          this.deleteSelected();
        }
        break;
    }
  }

  createNode(x, y) {
    const node = {
      id: this.nextNodeId++,
      x: x,
      y: y
    };
    this.nodes.push(node);
    this.saveToStorage();
    this.updateDataStructure();
  }

  createHyperedge() {
    if (this.selectedNodes.size < 2) {
      alert('Please select at least 2 nodes to create a hyperedge.');
      return;
    }

    const hyperedge = {
      id: this.nextHyperedgeId++,
      nodes: Array.from(this.selectedNodes),
      color: this.HYPEREDGE_COLORS[(this.nextHyperedgeId - 2) % this.HYPEREDGE_COLORS.length]
    };

    this.hyperedges.push(hyperedge);
    this.clearSelection();
    this.saveToStorage();
    this.updateDataStructure();
    this.render();
  }

  clearSelection() {
    this.selectedNodes.clear();
    this.updateSelectionUI();
    this.render();
  }

  clearAll() {
    if (this.nodes.length === 0 && this.hyperedges.length === 0) return;

    if (confirm('Are you sure you want to clear all nodes and hyperedges?')) {
      this.nodes = [];
      this.hyperedges = [];
      this.selectedNodes.clear();
      this.nextNodeId = 1;
      this.nextHyperedgeId = 1;
      this.clearStorage();
      this.updateDataStructure();
      this.updateSelectionUI();
      this.render();
    }
  }

  deleteSelected() {
    if (this.selectedNodes.size === 0) return;

    // Remove selected nodes
    this.nodes = this.nodes.filter(node => !this.selectedNodes.has(node.id));

    // Remove hyperedges that contain deleted nodes
    this.hyperedges = this.hyperedges.filter(hyperedge => {
      return !hyperedge.nodes.some(nodeId => this.selectedNodes.has(nodeId));
    });

    this.clearSelection();
    this.saveToStorage();
    this.updateDataStructure();
    this.render();
  }

  updateSelectionUI() {
    const selectedCount = this.selectedNodes.size;
    document.querySelector('.selection-count').textContent = `Selected: ${selectedCount} nodes`;
    document.getElementById('create-hyperedge').disabled = selectedCount < 2;
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    if (tabName === 'summary') {
      this.updateSummaryTab();
    }
  }

  updateSummaryTab() {
    // Update statistics
    document.getElementById('node-count').textContent = this.nodes.length;
    document.getElementById('hyperedge-count').textContent = this.hyperedges.length;

    // Calculate average degree
    let totalDegree = 0;
    this.nodes.forEach(node => {
      const degree = this.hyperedges.filter(he => he.nodes.includes(node.id)).length;
      totalDegree += degree;
    });
    const avgDegree = this.nodes.length > 0 ? (totalDegree / this.nodes.length).toFixed(2) : 0;
    document.getElementById('avg-degree').textContent = avgDegree;

    // Update hyperedge list
    const hyperedgeList = document.getElementById('hyperedge-summary');
    hyperedgeList.innerHTML = '';

    if (this.hyperedges.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No hyperedges created yet';
      li.style.fontStyle = 'italic';
      li.style.color = 'hsl(var(--text-light))';
      hyperedgeList.appendChild(li);
    } else {
      this.hyperedges.forEach(hyperedge => {
        const li = document.createElement('li');
        li.textContent = `H${hyperedge.id}: {${hyperedge.nodes.join(', ')}} (${hyperedge.nodes.length} nodes)`;
        li.style.borderLeftColor = hyperedge.color;
        hyperedgeList.appendChild(li);
      });
    }
  }

  updateDataStructure() {
    const data = {
      nodes: this.nodes.map(node => ({
        id: node.id,
        position: { x: Math.round(node.x), y: Math.round(node.y) }
      })),
      hyperedges: this.hyperedges.map(hyperedge => ({
        id: hyperedge.id,
        nodes: hyperedge.nodes,
        cardinality: hyperedge.nodes.length
      })),
      metadata: {
        nodeCount: this.nodes.length,
        hyperedgeCount: this.hyperedges.length,
        timestamp: new Date().toISOString()
      }
    };

    document.getElementById('data-structure').textContent = JSON.stringify(data, null, 2);
  }

  drawHyperedge(hyperedge) {
    if (hyperedge.nodes.length < 2) return;

    const hyperedgeNodes = hyperedge.nodes
    .map(nodeId => this.nodes.find(n => n.id === nodeId))
    .filter(node => node); // Filter out deleted nodes

    if (hyperedgeNodes.length < 2) return;

    this.ctx.save();
    this.ctx.strokeStyle = hyperedge.color;
    this.ctx.fillStyle = hyperedge.color + '20'; // Add transparency
    this.ctx.lineWidth = 3;

    // Calculate center point
    const centerX = hyperedgeNodes.reduce((sum, node) => sum + node.x, 0) / hyperedgeNodes.length;
    const centerY = hyperedgeNodes.reduce((sum, node) => sum + node.y, 0) / hyperedgeNodes.length;

    // Draw filled polygon connecting all nodes
    this.ctx.beginPath();

    if (hyperedgeNodes.length === 2) {
      // For 2 nodes, draw a curved line
      const node1 = hyperedgeNodes[0];
      const node2 = hyperedgeNodes[1];

      this.ctx.moveTo(node1.x, node1.y);

      // Calculate control point for curve
      const midX = (node1.x + node2.x) / 2;
      const midY = (node1.y + node2.y) / 2;
      const distance = Math.sqrt((node2.x - node1.x) ** 2 + (node2.y - node1.y) ** 2);
      const offset = Math.min(distance / 4, 50);

      // Perpendicular offset for curve
      const perpX = -(node2.y - node1.y) / distance * offset;
      const perpY = (node2.x - node1.x) / distance * offset;

      this.ctx.quadraticCurveTo(midX + perpX, midY + perpY, node2.x, node2.y);
      this.ctx.stroke();

    } else {
      // For 3+ nodes, draw a polygon with rounded corners
      hyperedgeNodes.sort((a, b) => {
        const angleA = Math.atan2(a.y - centerY, a.x - centerX);
        const angleB = Math.atan2(b.y - centerY, b.x - centerX);
        return angleA - angleB;
      });

      this.ctx.moveTo(hyperedgeNodes[0].x, hyperedgeNodes[0].y);

      for (let i = 1; i < hyperedgeNodes.length; i++) {
        this.ctx.lineTo(hyperedgeNodes[i].x, hyperedgeNodes[i].y);
      }

      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    }

    // Draw hyperedge label
    this.ctx.fillStyle = hyperedge.color;
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`H${hyperedge.id}`, centerX, centerY - 5);

    this.ctx.restore();
  }

  drawNode(node) {
    const isSelected = this.selectedNodes.has(node.id);
    const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;

    this.ctx.save();

    // Node circle
    this.ctx.beginPath();
    this.ctx.arc(node.x, node.y, this.NODE_RADIUS, 0, 2 * Math.PI);

    if (isSelected) {
      this.ctx.fillStyle = this.NODE_SELECTED_COLOR;
    } else if (isHovered) {
      this.ctx.fillStyle = this.NODE_HOVER_COLOR;
    } else {
      this.ctx.fillStyle = this.NODE_COLOR;
    }

    this.ctx.fill();

    // Node border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Node label
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 10px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(node.id.toString(), node.x, node.y);

    this.ctx.restore();
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw hyperedges first (behind nodes)
    this.hyperedges.forEach(hyperedge => this.drawHyperedge(hyperedge));

    // Draw nodes
    this.nodes.forEach(node => this.drawNode(node));

    // Draw instructions if no nodes exist
    if (this.nodes.length === 0) {
      this.ctx.save();
      this.ctx.fillStyle = '#64748B';
      this.ctx.font = '18px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('Click anywhere to create your first node', 
        this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.restore();
    }
  }

  exportToPNG() {
    if (this.nodes.length === 0) {
      alert('Please create some nodes before exporting.');
      return;
    }

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Fill with white background
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the current canvas content on top
    tempCtx.drawImage(this.canvas, 0, 0);

    // Create download link
    const link = document.createElement('a');
    link.download = `hypergraph-${new Date().getTime()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  }

  exportToSVG() {
    if (this.nodes.length === 0) {
      alert('Please create some nodes before exporting.');
      return;
    }

    // Create SVG content
    const svgNamespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNamespace, 'svg');
    svg.setAttribute('width', this.canvas.width);
    svg.setAttribute('height', this.canvas.height);
    svg.setAttribute('viewBox', `0 0 ${this.canvas.width} ${this.canvas.height}`);
    svg.style.background = '#ffffff';

    // Add white background rectangle
    const background = document.createElementNS(svgNamespace, 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', '#ffffff');
    svg.appendChild(background);

    // Draw hyperedges as SVG elements
    this.hyperedges.forEach(hyperedge => {
      const hyperedgeNodes = hyperedge.nodes
      .map(nodeId => this.nodes.find(n => n.id === nodeId))
      .filter(node => node);

      if (hyperedgeNodes.length < 2) return;

      if (hyperedgeNodes.length === 2) {
        // Draw curved line for 2 nodes
        const node1 = hyperedgeNodes[0];
        const node2 = hyperedgeNodes[1];

        const midX = (node1.x + node2.x) / 2;
        const midY = (node1.y + node2.y) / 2;
        const distance = Math.sqrt((node2.x - node1.x) ** 2 + (node2.y - node1.y) ** 2);
        const offset = Math.min(distance / 4, 50);

        const perpX = -(node2.y - node1.y) / distance * offset;
        const perpY = (node2.x - node1.x) / distance * offset;

        const path = document.createElementNS(svgNamespace, 'path');
        path.setAttribute('d', `M ${node1.x} ${node1.y} Q ${midX + perpX} ${midY + perpY} ${node2.x} ${node2.y}`);
        path.setAttribute('stroke', hyperedge.color);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);
      } else {
        // Draw polygon for 3+ nodes
        const centerX = hyperedgeNodes.reduce((sum, node) => sum + node.x, 0) / hyperedgeNodes.length;
        const centerY = hyperedgeNodes.reduce((sum, node) => sum + node.y, 0) / hyperedgeNodes.length;

        hyperedgeNodes.sort((a, b) => {
          const angleA = Math.atan2(a.y - centerY, a.x - centerX);
          const angleB = Math.atan2(b.y - centerY, b.x - centerX);
          return angleA - angleB;
        });

        const points = hyperedgeNodes.map(node => `${node.x},${node.y}`).join(' ');

        const polygon = document.createElementNS(svgNamespace, 'polygon');
        polygon.setAttribute('points', points);
        polygon.setAttribute('fill', hyperedge.color + '33'); // Add transparency
        polygon.setAttribute('stroke', hyperedge.color);
        polygon.setAttribute('stroke-width', '3');
        svg.appendChild(polygon);
      }

      // Add hyperedge label
      const centerX = hyperedgeNodes.reduce((sum, node) => sum + node.x, 0) / hyperedgeNodes.length;
      const centerY = hyperedgeNodes.reduce((sum, node) => sum + node.y, 0) / hyperedgeNodes.length;

      const text = document.createElementNS(svgNamespace, 'text');
      text.setAttribute('x', centerX);
      text.setAttribute('y', centerY - 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-family', 'Computer Modern Serif, serif');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', hyperedge.color);
      text.textContent = `H${hyperedge.id}`;
      svg.appendChild(text);
    });

    // Draw nodes as SVG circles
    this.nodes.forEach(node => {
      const circle = document.createElementNS(svgNamespace, 'circle');
      circle.setAttribute('cx', node.x);
      circle.setAttribute('cy', node.y);
      circle.setAttribute('r', this.NODE_RADIUS);
      circle.setAttribute('fill', this.NODE_COLOR);
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '2');
      svg.appendChild(circle);

      // Add node label
      const text = document.createElementNS(svgNamespace, 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y + 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-family', 'Computer Modern Serif, serif');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-weight', 'bold');
      text.setAttribute('fill', '#ffffff');
      text.textContent = node.id.toString();
      svg.appendChild(text);
    });

    // Convert SVG to string and create download
    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `hypergraph-${new Date().getTime()}.svg`;
    link.href = url;
    link.click();

    // Clean up
    URL.revokeObjectURL(url);
  }

  copyJSONToClipboard() {
    const jsonData = document.getElementById('data-structure').textContent;

    if (!jsonData || jsonData.trim() === '') {
      alert('No data to copy. Please create some nodes first.');
      return;
    }

    navigator.clipboard.writeText(jsonData).then(() => {
      const button = document.getElementById('copy-json');
      const originalText = button.textContent;

      // Show feedback
      button.textContent = 'Copied!';
      button.classList.add('copied');

      // Reset after 2 seconds
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    }).catch(err => {
        // Fallback for older browsers
        console.error('Could not copy text: ', err);

        // Create a temporary textarea
        const textarea = document.createElement('textarea');
        textarea.value = jsonData;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        const button = document.getElementById('copy-json');
        const originalText = button.textContent;

        button.textContent = 'Copied!';
        button.classList.add('copied');

        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 2000);
      });
  }

  saveToStorage() {
    try {
      const data = {
        nodes: this.nodes,
        hyperedges: this.hyperedges,
        nextNodeId: this.nextNodeId,
        nextHyperedgeId: this.nextHyperedgeId,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('hypergraph-data', JSON.stringify(data));
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }

  loadFromStorage() {
    try {
      const savedData = localStorage.getItem('hypergraph-data');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.nodes = data.nodes || [];
        this.hyperedges = data.hyperedges || [];
        this.nextNodeId = data.nextNodeId || 1;
        this.nextHyperedgeId = data.nextHyperedgeId || 1;

        // Ensure node IDs are unique and sequential
        if (this.nodes.length > 0) {
          const maxNodeId = Math.max(...this.nodes.map(n => n.id));
          this.nextNodeId = Math.max(this.nextNodeId, maxNodeId + 1);
        }

        if (this.hyperedges.length > 0) {
          const maxHyperedgeId = Math.max(...this.hyperedges.map(h => h.id));
          this.nextHyperedgeId = Math.max(this.nextHyperedgeId, maxHyperedgeId + 1);
        }

        console.log('Loaded hypergraph from storage:', this.nodes.length, 'nodes,', this.hyperedges.length, 'hyperedges');
      }
    } catch (error) {
      console.warn('Could not load from localStorage:', error);
    }
  }

  clearStorage() {
    try {
      localStorage.removeItem('hypergraph-data');
    } catch (error) {
      console.warn('Could not clear localStorage:', error);
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HypergraphTool();
});


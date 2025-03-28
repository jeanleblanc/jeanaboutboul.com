// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Fade-in animation for sections
    const sections = document.querySelectorAll('.section');
    
    // Add fade-in class to sections when they come into view
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        observer.observe(section);
    });
    
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.padding = '1rem 5%';
            navbar.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.padding = '1.5rem 5%';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    });
    
    // Simple mind map visualization
    const mindMap = document.querySelector('.mind-map');
    if (mindMap) {
        const nodes = mindMap.querySelectorAll('.node:not(.central-node)');
        const centralNode = mindMap.querySelector('.central-node');
        
        // Position nodes in a circular pattern around the central node
        if (centralNode && nodes.length > 0) {
            const radius = 120; // Adjust as needed
            const angleStep = (2 * Math.PI) / nodes.length;
            
            nodes.forEach((node, index) => {
                const angle = index * angleStep;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                
                node.style.transform = `translate(${x}px, ${y}px)`;
                node.style.position = 'absolute';
                
                // Create connecting line
                const line = document.createElement('div');
                line.className = 'connector';
                line.style.position = 'absolute';
                line.style.height = '2px';
                line.style.backgroundColor = '#C2703D';
                line.style.transformOrigin = 'left center';
                line.style.width = `${radius}px`;
                line.style.transform = `rotate(${angle}rad)`;
                line.style.opacity = '0.6';
                
                centralNode.style.position = 'absolute';
                centralNode.appendChild(line);
            });
            
            centralNode.style.zIndex = '2';
            
            // Add hover effect for connections
            nodes.forEach((node, index) => {
                node.addEventListener('mouseover', () => {
                    const connectors = document.querySelectorAll('.connector');
                    connectors[index].style.opacity = '1';
                    connectors[index].style.height = '3px';
                });
                
                node.addEventListener('mouseout', () => {
                    const connectors = document.querySelectorAll('.connector');
                    connectors[index].style.opacity = '0.6';
                    connectors[index].style.height = '2px';
                });
            });
        }
    }
    
    // Project tiles interaction
    const projectTiles = document.querySelectorAll('.project-tile');
    projectTiles.forEach(tile => {
        tile.addEventListener('mouseenter', function() {
            projectTiles.forEach(t => {
                if (t !== tile) {
                    t.style.opacity = '0.7';
                    t.style.transform = 'scale(0.95)';
                }
            });
        });
        
        tile.addEventListener('mouseleave', function() {
            projectTiles.forEach(t => {
                t.style.opacity = '1';
                t.style.transform = '';
            });
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
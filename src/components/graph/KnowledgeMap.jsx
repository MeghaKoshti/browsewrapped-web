import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { summarizeKnowledgeMap } from '../../lib/chartSummaries'

export default function KnowledgeMap({ nodes, edges }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!nodes?.length || !ref.current) return

    const el = ref.current
    const W = el.clientWidth || 900
    const H = 500

    const svg = d3.select(el)
    svg.selectAll('*').remove()

    svg
      .attr('width', W)
      .attr('height', H)

    const defs = svg.append('defs')

    // Glow filter
    const glow = defs.append('filter').attr('id', 'node-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
    glow.append('feGaussianBlur').attr('stdDeviation', 6).attr('result', 'blur')
    const merge = glow.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Gradient per node (created dynamically)
    const gradIds = {}
    nodes.forEach((n) => {
      const id = `grad-${n.id.replace(/\W/g, '')}`
      gradIds[n.id] = id
      const g = defs.append('radialGradient').attr('id', id)
      g.append('stop').attr('offset', '0%').attr('stop-color', n.color).attr('stop-opacity', 1)
      g.append('stop').attr('offset', '100%').attr('stop-color', n.color).attr('stop-opacity', 0.55)
    })

    const simNodes = nodes.map((n) => ({ ...n }))
    const simEdges = edges
      .filter((e) => nodes.find((n) => n.id === e.source) && nodes.find((n) => n.id === e.target))
      .map((e) => ({ ...e }))

    const sizeScale = d3.scaleLinear()
      .domain(d3.extent(nodes, (n) => n.size))
      .range([16, 54])

    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simEdges).id((d) => d.id).distance(140).strength(0.35))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(W / 2, H / 2))
      // forceCenter only moves the whole graph; a topic with no edges was
      // pushed by the charge into a corner. A weak pull keeps it near the rest.
      .force('x', d3.forceX(W / 2).strength(0.08))
      .force('y', d3.forceY(H / 2).strength(0.08))
      .force('collision', d3.forceCollide().radius((d) => sizeScale(d.size) + 22))

    // Edges
    const link = svg.append('g')
      .selectAll('line')
      .data(simEdges)
      .join('line')
      .attr('stroke', 'rgba(168,85,247,0.12)')
      .attr('stroke-width', (d) => Math.max(1, Math.log(d.weight + 1) * 0.9))

    // Nodes
    const nodeG = svg.append('g')
      .selectAll('g')
      .data(simNodes)
      .join('g')
      .style('cursor', 'grab')
      .call(
        d3.drag()
          .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y })
          .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null })
      )

    // Outer glow ring
    nodeG.append('circle')
      .attr('r', (d) => sizeScale(d.size) + 10)
      .attr('fill', (d) => d.color)
      .attr('opacity', 0.1)
      .attr('filter', 'url(#node-glow)')

    // Main circle
    nodeG.append('circle')
      .attr('r', (d) => sizeScale(d.size))
      .attr('fill', (d) => `url(#${gradIds[d.id]})`)
      .attr('stroke', (d) => d.color)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)

    // Visit count (large nodes only)
    nodeG.filter((d) => sizeScale(d.size) > 25)
      .append('text')
      .text((d) => d.visits > 999 ? `${(d.visits / 1000).toFixed(1)}k` : d.visits)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', (d) => Math.min(sizeScale(d.size) * 0.4, 13))
      .attr('font-weight', '500')
      .attr('fill', 'rgba(255,255,255,0.85)')

    // Label below
    nodeG.append('text')
      .text((d) => d.label)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--font-display)')
      .attr('font-size', 11)
      .attr('font-weight', '600')
      .attr('fill', '#94a3b8')
      .attr('dy', (d) => sizeScale(d.size) + 16)

    sim.on('tick', () => {
      const pad = (d) => sizeScale(d.size) + 22
      simNodes.forEach((d) => {
        d.x = Math.max(pad(d), Math.min(W - pad(d), d.x))
        d.y = Math.max(pad(d), Math.min(H - pad(d), d.y))
      })
      link
        .attr('x1', (d) => d.source.x).attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x).attr('y2', (d) => d.target.y)
      nodeG.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    return () => sim.stop()
  }, [nodes, edges])

  return (
    <svg
      ref={ref}
      className="knowledge-graph-svg"
      role="img"
      aria-label={summarizeKnowledgeMap(nodes)}
      style={{ display: 'block', width: '100%', height: 500 }}
    />
  )
}

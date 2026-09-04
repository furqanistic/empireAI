const apiHost = (
  import.meta.env.VITE_API_URL || 'http://localhost:8800/api'
).replace(/\/api\/?$/, '')

export const mediaUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }
  return `${apiHost}${url}`
}

export const uid = () => `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const emptyText = () => ({
  id: uid(),
  type: 'text',
  html: '<p></p>',
  align: 'left',
})

export const withBlocks = (content) => {
  if (!content) return content
  if (content.blocks?.length) return content
  const blocks = []
  for (const section of content.sections || []) {
    blocks.push({
      id: uid(),
      type: 'heading',
      level: 2,
      text: section.heading,
      align: 'left',
    })
    if (section.content) {
      blocks.push({
        id: uid(),
        type: 'text',
        html: `<p>${String(section.content)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</p>`,
        align: 'left',
      })
    }
    if (section.items?.length) {
      blocks.push({
        id: uid(),
        type: 'list',
        style: 'check',
        align: 'left',
        items: section.items.map((text) => ({ id: uid(), text, checked: false })),
      })
    }
  }
  return { ...content, blocks: blocks.length ? blocks : [emptyText()] }
}

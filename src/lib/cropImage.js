export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous') 
    image.src = url
  })

export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  // Configura o tamanho exato do canvas para o tamanho do recorte
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Desenha a imagem cortada
  // SINTAXE: drawImage(imagem, x_recorte, y_recorte, w_recorte, h_recorte, x_canvas, y_canvas, w_canvas, h_canvas)
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Converte para arquivo (Blob)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        // Se der erro, rejeita
        reject(new Error('Canvas is empty'))
        return
      }
      resolve(blob)
    }, 'image/jpeg', 0.95) // Salva como JPG com 95% de qualidade
  })
}
(function () {
    var isTouch = window.matchMedia('(hover: none)').matches
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    var finePointer = window.matchMedia('(pointer: fine)').matches

    /* ---------- Splash preloader ---------- */
    var splash = document.getElementById('splash')
    function hideSplash() {
        if (!splash) return
        splash.classList.add('hide')
        setTimeout(function () { if (splash.parentNode) splash.parentNode.removeChild(splash) }, 600)
    }
    if (splash) {
        if (document.readyState !== 'loading') setTimeout(hideSplash, 300)
        else document.addEventListener('DOMContentLoaded', function () { setTimeout(hideSplash, 300) })
        setTimeout(hideSplash, 1200)
    }

    /* ---------- Custom cursor (desktop only) ---------- */
    if (false && finePointer) {
        document.body.classList.add('custom-cursor')
        var dot = document.createElement('div')
        dot.className = 'cursor-dot'
        var ring = document.createElement('div')
        ring.className = 'cursor-ring'
        document.body.appendChild(dot)
        document.body.appendChild(ring)

        var px = innerWidth / 2, py = innerHeight / 2, rx = px, ry = py, shown = false
        document.addEventListener('mousemove', function (e) {
            px = e.clientX
            py = e.clientY
            dot.style.transform = 'translate(' + (px - 4) + 'px,' + (py - 4) + 'px)'
            if (!shown) { shown = true; dot.style.opacity = 1; ring.style.opacity = 1 }
        })
        ;(function loop() {
            rx += (px - rx) * 0.13
            ry += (py - ry) * 0.13
            ring.style.transform = 'translate(' + (rx - 19) + 'px,' + (ry - 19) + 'px)'
            requestAnimationFrame(loop)
        })()

        var hoverTargets = 'a, button, .menu-item, input, select, .tilt'
        document.addEventListener('mouseover', function (e) {
            if (e.target.closest(hoverTargets)) document.body.classList.add('cursor-hover')
        })
        document.addEventListener('mouseout', function (e) {
            if (e.target.closest(hoverTargets)) document.body.classList.remove('cursor-hover')
        })
    }

    /* ---------- Particles ---------- */
    if (false && !prefersReduced) {
        var canvas = document.getElementById('particles')
        if (canvas) {
            var ctx = canvas.getContext('2d')
            var W, H, parts = []
            function resize() {
                W = canvas.width = canvas.offsetWidth
                H = canvas.height = canvas.offsetHeight
            }
            resize()
            window.addEventListener('resize', resize)

            var COUNT = window.innerWidth < 560 ? 24 : 46
            for (var i = 0; i < COUNT; i++) {
                parts.push({
                    x: Math.random() * W,
                    y: H + Math.random() * H,
                    r: 1 + Math.random() * 2.4,
                    vy: 0.4 + Math.random() * 1.1,
                    vx: (Math.random() - 0.5) * 0.4,
                    a: 0.12 + Math.random() * 0.4,
                    tw: Math.random() * Math.PI * 2
                })
            }
            function tick() {
                ctx.clearRect(0, 0, W, H)
                for (var i = 0; i < parts.length; i++) {
                    var p = parts[i]
                    p.y -= p.vy
                    p.x += p.vx
                    p.tw += 0.02
                    if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W }
                    var alpha = p.a * (0.5 + 0.5 * Math.sin(p.tw))
                    var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
                    g.addColorStop(0, 'rgba(255,80,60,' + alpha.toFixed(3) + ')')
                    g.addColorStop(1, 'rgba(255,80,60,0)')
                    ctx.fillStyle = g
                    ctx.beginPath()
                    ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
                    ctx.fill()
                }
                requestAnimationFrame(tick)
            }
            tick()
        }
    }

    /* ---------- Reveal on scroll ---------- */
    var revealEls = document.querySelectorAll('.reveal')
    if (revealEls.length && 'IntersectionObserver' in window && !prefersReduced) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add('in')
                    io.unobserve(en.target)
                }
            })
        }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' })
        revealEls.forEach(function (el) { io.observe(el) })
    } else {
        revealEls.forEach(function (el) { el.classList.add('in') })
    }

    /* ---------- 3D tilt (غیرفعال در تم جدید) ---------- */
    if (false) {
        document.querySelectorAll('.tilt').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect()
                var dx = (e.clientX - r.left) / r.width - 0.5
                var dy = (e.clientY - r.top) / r.height - 0.5
                el.style.transform = 'perspective(820px) rotateY(' + (dx * 12).toFixed(2) + 'deg) rotateX(' + (-dy * 12).toFixed(2) + 'deg) translateY(-4px)'
            })
            el.addEventListener('mouseleave', function () {
                el.style.transform = ''
            })
        })
    }

    /* ---------- Magnetic buttons (غیرفعال در تم جدید) ---------- */
    if (false) {
        document.querySelectorAll('.btn').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                var r = el.getBoundingClientRect()
                var x = (e.clientX - r.left - r.width / 2) * 0.18
                var y = (e.clientY - r.top - r.height / 2) * 0.3
                el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)'
            })
            el.addEventListener('mouseleave', function () {
                el.style.transform = ''
            })
        })
    }

    /* ---------- Back to top ---------- */
    var topBtn = document.getElementById('back-to-top')
    if (topBtn) {
        window.addEventListener('scroll', function () {
            topBtn.classList.toggle('show', window.scrollY > 480)
        }, { passive: true })
        topBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        })
    }

    /* ---------- PWA ---------- */
    var deferredPrompt = null

    function notify(msg) {
        var c = document.getElementById('toast-container')
        if (!c) return
        var t = document.createElement('div')
        t.className = 'toast'
        t.textContent = msg
        c.appendChild(t)
        setTimeout(function () {
            t.classList.add('hide')
            setTimeout(function () { t.remove() }, 350)
        }, 2200)
    }

    if ('serviceWorker' in navigator) {
        var refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (refreshing) return
            refreshing = true
            location.reload()
        })
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').catch(function () { })
        })
    }

    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault()
        deferredPrompt = e
        showInstallBtn()
    })

    window.addEventListener('appinstalled', function () {
        deferredPrompt = null
        showInstallBtn()
        notify('اپ نصب شد ✓')
    })

    function showInstallBtn() {
        var b = document.getElementById('install-btn')
        if (b) b.style.display = deferredPrompt ? 'flex' : 'none'
    }

    window.installPWA = function () {
        var b = document.getElementById('install-btn')
        if (deferredPrompt) {
            deferredPrompt.prompt()
            deferredPrompt.userChoice.then(function (r) {
                if (r.outcome === 'accepted' && b) b.style.display = 'none'
                deferredPrompt = null
            }).catch(function () { })
            return
        }
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            alert('📲 دکمه Share پایین صفحه رو بزن\nسپس Add to Home Screen')
        } else if (/Android/.test(navigator.userAgent)) {
            alert('📲 سه نقطه بالا سمت راست رو بزن\nسپس Install app')
        } else {
            alert('📲 روی آیکون Install توی نوار آدرس مرورگر کلیک کن')
        }
    }

    var installBtns = document.querySelectorAll('#install-btn')
    installBtns.forEach(function (b) {
        b.addEventListener('click', function (e) {
            e.stopPropagation()
            window.installPWA()
        })
    })
    showInstallBtn()

    /* ---------- بازتاب نور شیشه (دنبال موس/انگشت) ---------- */
    document.addEventListener('pointermove', function (e) {
        var el = e.target.closest && e.target.closest('.menu-item, .about-card, .info-box')
        if (!el) return
        var r = el.getBoundingClientRect()
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%')
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%')
    }, { passive: true })
})()

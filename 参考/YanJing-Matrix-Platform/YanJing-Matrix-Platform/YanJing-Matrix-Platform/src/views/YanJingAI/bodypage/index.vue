<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const goBody = (id: number) => {
    const pathMap: Record<number, string> = {
        1: '/opc',
        2: '/cua',
        3: '/custom'
    }
    const targetPath = pathMap[id] ?? route.path
    if (targetPath !== route.path) {
        router.push({ path: targetPath, hash: '#bodies' })
        return
    }
    router.push({
        path: route.path,
        query: { ...route.query, body: id },
        hash: '#bodies'
    })
}
</script>

<template>
    <div id="session1" class="session1">
        <div class="session11">
            <div class="session111">
                <div class="img1">
                    <img src="@/assets/YanJingAI2/image@1x.webp" alt="image" />
                </div>
                <div class="img2">
                    <img src="@/assets/YanJingAI2/组 2@1x.webp" alt="image" />
                </div>

            </div>
            <div class="session112">
                <div class="session1121">
                    <div class="icon1">
                        <img src="@/assets/YanJingAI2/ICON@1x (1).webp" alt="image" />
                    </div>
                    <div class="text1">
                        {{ $t('YanJingAI2.session1.text1') }}

                    </div>
                </div>
                <div class="session1122">
                    <div class="text2">
                        {{ $t('YanJingAI2.session1.text2') }}
                    </div>
                </div>
                <div class="session1123">
                    <div class="text3">
                        <p>{{ $t('YanJingAI2.session1.text3') }}</p>
                        <p>{{ $t('YanJingAI2.session1.text4') }}</p>
                    </div>
                </div>
                <!--div class="session1124">
                    <div class="session11241">
                        <div class="text4">
                            {{ $t('YanJingAI2.session1.text5') }}
                        </div>
                        <div class="icon2">
                            <img src="@/assets/YanJingAI2/ICON@1x (2).webp" alt="image" />
                        </div>
                    </div>
                    <div class="session11242">
                        <div class="text5">
                            {{ $t('YanJingAI2.session1.text6') }}
                        </div>
                    </div>
                </div-->
            </div>

        </div>

    </div>















    <div id="session2" class="session2">
        <div class="session21">
            <div class="text6">
                {{ $t('YanJingAI2.session2.text1') }}
            </div>
            <div class="text7">
                <p> {{ $t('YanJingAI2.session2.text2') }}</p>
                <p> {{ $t('YanJingAI2.session2.text3') }}</p>
            </div>
        </div>
        <div class="session22">
            <div class="session221">
                <div class="session2211">
                    <div class="session22111">
                        <div class="text8">
                            01
                        </div>
                    </div>
                    <div class="session22112">
                        <div class="text9">
                            {{ $t('YanJingAI2.session2.part1.text1') }}
                        </div>
                        <div class="text10">
                            {{ $t('YanJingAI2.session2.part1.text2') }}
                        </div>
                    </div>
                </div>
                <div class="session2212">
                    <div class="img3">
                        <img src="@/assets/YanJingAI2/image@1x (1).webp" alt="image" />
                    </div>
                </div>
                <div class="session2213">
                    <div class="text11">
                        {{ $t('YanJingAI2.session2.part1.text3') }}
                    </div>
                    <div class="session22131">
                        <div class="session221311">
                            <div class="session2213111">
                                <div class="icon3">
                                    <img src="@/assets/YanJingAI2/路径@1x.webp" alt="image" />
                                </div>
                            </div>
                            <div class="session2213112">
                                <div class="text12">
                                    {{ $t('YanJingAI2.session2.part1.text4') }}
                                </div>
                            </div>
                        </div>
                        <div class="session221312">
                            <div class="session2213121">
                                <div class="text13">
                                    {{ $t('YanJingAI2.session2.part1.text5') }}
                                </div>
                            </div>
                            <div class="session2213122">
                                <div class="icon4">
                                    <img src="@/assets/YanJingAI2/路径@1x (1).webp" alt="image" />
                                </div>
                            </div>
                        </div>
                        <div class="session221313">
                            <div class="session2213131">
                                <div class="icon51">
                                    <img src="@/assets/YanJingAI2/路径@1x (2).webp" alt="image" />
                                </div>
                            </div>
                            <div class="session2213132">
                                <div class="text14">
                                    {{ $t('YanJingAI2.session2.part1.text6') }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="session222">
                <div class="session2211">
                    <div class="session22111">
                        <div class="text8">
                            02
                        </div>
                    </div>
                    <div class="session22112">
                        <div class="text9">
                            {{ $t('YanJingAI2.session2.part2.text1') }}
                        </div>
                        <div class="text10">
                            {{ $t('YanJingAI2.session2.part2.text2') }}
                        </div>
                    </div>
                </div>
                <div class="session2212">
                    <div class="img3">
                        <img src="@/assets/YanJingAI2/image@1x (2).webp" alt="image" />
                    </div>
                </div>
                <div class="session2213">
                    <div class="text11">
                        {{ $t('YanJingAI2.session2.part2.text3') }}
                    </div>
                    <div class="session22131">
                        <div class="session221311">
                            <div class="session2213111">
                                <div class="icon3">
                                    <img src="@/assets/YanJingAI2/路径@1x (3).webp" alt="image" />
                                </div>
                            </div>
                            <div class="session2213112">
                                <div class="text12">
                                    {{ $t('YanJingAI2.session2.part2.text4') }}
                                </div>
                            </div>
                        </div>
                        <div class="session221312">
                            <div class="session2213121">
                                <div class="text13">
                                    {{ $t('YanJingAI2.session2.part2.text5') }}
                                </div>
                            </div>
                            <div class="session2213122">
                                <div class="icon4">
                                    <img src="@/assets/YanJingAI2/路径@1x (4).webp" alt="image" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="session223">
                <div class="session2211">
                    <div class="session22111">
                        <div class="text8">
                            03
                        </div>
                    </div>
                    <div class="session22112">
                        <div class="text9">
                            {{ $t('YanJingAI2.session2.part3.text1') }}
                        </div>
                        <div class="text10">
                            {{ $t('YanJingAI2.session2.part3.text2') }}
                        </div>
                    </div>
                </div>
                <div class="session2212">
                    <div class="img3">
                        <img src="@/assets/YanJingAI2/image@1x (3).webp" alt="image" />
                    </div>
                </div>
                <div class="session2213">
                    <div class="text11">
                        {{ $t('YanJingAI2.session2.part3.text3') }}
                    </div>
                    <div class="session22131">
                        <div class="session221311">
                            <div class="session2213111">
                                <div class="icon3">
                                    <img src="@/assets/YanJingAI2/路径@1x (5).webp" alt="image" />
                                </div>
                            </div>
                            <div class="session2213112">
                                <div class="text12">
                                    {{ $t('YanJingAI2.session2.part3.text4') }}
                                </div>
                            </div>
                        </div>
                        <div class="session221312">
                            <div class="session2213121">
                                <div class="text13">
                                    {{ $t('YanJingAI2.session2.part3.text5') }}
                                </div>
                            </div>
                            <div class="session2213122">
                                <div class="icon4">
                                    <img src="@/assets/YanJingAI2/路径@1x (6).webp" alt="image" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>














    <div id="session3" class="session3">
        <div class="session31">
            <div class="text141">
                {{ $t('YanJingAI2.session3.text1') }}
            </div>
            <div class="text15">
                <p class="subtitle-line1">{{ $t('YanJingAI2.session3.text2') }}</p>
                <p class="subtitle-line2">
                    <span class="highlight">{{ $t('YanJingAI2.session3.text3') }}</span>
                    {{ $t('YanJingAI2.session3.text4') }}
                </p>
            </div>
        </div>
        <div class="session32">
            <div class="session321" role="button" tabindex="0" title="点击查看更多详细信息" @click="goBody(1)" @keydown.enter="goBody(1)">
                <div class="session3211">
                    <div class="session32111">
                        <div class="session321111">
                            <div class="text16">
                                {{ $t('YanJingAI2.session3.part1.text9') }}
                            </div>
                        </div>
                        <div class="session321111">
                            <div class="text16">
                                {{ $t('YanJingAI2.session3.part1.text10') }}
                            </div>
                        </div>
                        <div class="session321111">
                            <div class="text16">
                                {{ $t('YanJingAI2.session3.part1.text11') }}
                            </div>
                        </div>
                    </div>
                    <div class="img4">
                        <img src="@/assets/YanJingAI2/image@1x (4).webp" alt="image" />
                    </div>
                </div>
                <div class="session3212">
                    <div class="session32121">
                        <div class="session321211-row">
                            <div class="session321211">
                                <div class="text17">
                                    {{ $t('YanJingAI2.session3.part1.text1') }}
                                </div>
                            </div>
                            <span class="learn-more">了解更多</span>
                        </div>
                        <div class="icon5">
                            <img src="@/assets/YanJingAI2/ICON@1x (3).webp" alt="image" />
                        </div>
                        <div class="session321212">
                            <div class="text18">
                                {{ $t('YanJingAI2.session3.part1.text2') }}
                            </div>
                            <div class="text19">
                                <p>{{ $t('YanJingAI2.session3.part1.text3') }}</p>
                                <p class="highlight">{{ $t('YanJingAI2.session3.part1.text4') }}</p>
                                <p>{{ $t('YanJingAI2.session3.part1.text5') }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="session32122">
                        <div class="session321221">
                            <div class="text20">
                                {{ $t('YanJingAI2.session3.part1.text6') }}
                            </div>
                        </div>
                        <div class="session321221">
                            <div class="text20">
                                {{ $t('YanJingAI2.session3.part1.text7') }}
                            </div>
                        </div>
                        <div class="session321221">
                            <div class="text20">
                                {{ $t('YanJingAI2.session3.part1.text8') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="session322" role="button" tabindex="0" title="点击查看更多详细信息" @click="goBody(2)" @keydown.enter="goBody(2)">
                <div class="session3212">
                    <div class="session32121">
                        <div class="session321211-row">
                            <div class="session321211">
                                <div class="text17">
                                    {{ $t('YanJingAI2.session3.part2.text1') }}
                                </div>
                            </div>
                            <span class="learn-more">了解更多</span>
                        </div>
                        <div class="icon5">
                            <img src="@/assets/YanJingAI2/ICON@1x (4).webp" alt="image" />
                        </div>
                        <div class="session321212">
                            <div class="text18">
                                {{ $t('YanJingAI2.session3.part2.text2') }}
                            </div>
                            <div class="text19">
                                <p>{{ $t('YanJingAI2.session3.part2.text3') }}</p>
                                <p class="highlight">{{ $t('YanJingAI2.session3.part2.text4') }}</p>
                                <p>{{ $t('YanJingAI2.session3.part2.text5') }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="session32122">
                        <div class="session321221">
                            <div class="text20">
                                {{ $t('YanJingAI2.session3.part2.text6') }}
                            </div>
                        </div>
                        <div class="session321221">
                            <div class="text20">
                                {{ $t('YanJingAI2.session3.part2.text7') }}
                            </div>
                        </div>
                        <div class="session321221">
                            <div class="text20">
                                {{ $t('YanJingAI2.session3.part2.text8') }}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="session3211">
                    <div class="session32111">
                        <div class="session321111">
                            <div class="text16">
                                {{ $t('YanJingAI2.session3.part2.text9') }}
                            </div>
                        </div>
                        <div class="session321111">
                            <div class="text16">
                                {{ $t('YanJingAI2.session3.part2.text10') }}
                            </div>
                        </div>
                        <div class="session321111">
                            <div class="text16">
                                {{ $t('YanJingAI2.session3.part2.text11') }}
                            </div>
                        </div>
                    </div>
                    <div class="img4">
                        <img src="@/assets/YanJingAI2/image@1x (5).webp" alt="image" />
                    </div>
                </div>
            </div>
            <div class="session323" role="button" tabindex="0" title="点击查看更多详细信息" @click="goBody(3)" @keydown.enter="goBody(3)">
                <div class="session3211">
                    <div class="session32111">
                        <div class="session321111">
                            <div class="text16">
                                {{ $t('YanJingAI2.session3.part3.text9') }}
                            </div>
                        </div>
                        <div class="session321111">
                            <div class="text16">
                                {{ $t('YanJingAI2.session3.part3.text10') }}
                            </div>
                        </div>
                        <div class="session321111">
                            <div class="text16">
                                {{ $t('YanJingAI2.session3.part3.text11') }}
                            </div>
                        </div>
                    </div>
                    <div class="img4">
                        <img src="@/assets/YanJingAI2/image@1x (6).webp" alt="image" />
                    </div>
                </div>
                <div class="session3212">
                    <div class="session32121">
                        <div class="session321211-row">
                            <div class="session321211">
                                <div class="text17">
                                    {{ $t('YanJingAI2.session3.part3.text1') }}
                                </div>
                            </div>
                            <span class="learn-more">了解更多</span>
                        </div>
                        <div class="icon5">
                            <img src="@/assets/YanJingAI2/ICON@1x (5).webp" alt="image" />
                        </div>
                        <div class="session321212">
                            <div class="text18">
                                {{ $t('YanJingAI2.session3.part3.text2') }}
                            </div>
                            <div class="text19">
                                <p>{{ $t('YanJingAI2.session3.part3.text3') }}</p>
                                <p class="highlight">{{ $t('YanJingAI2.session3.part3.text4') }}</p>
                                <p>{{ $t('YanJingAI2.session3.part3.text5') }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="session32122">
                        <div class="session321221">
                            <div class="text20">
                                {{ $t('YanJingAI2.session3.part3.text6') }}
                            </div>
                        </div>
                        <div class="session321221">
                            <div class="text20">
                                {{ $t('YanJingAI2.session3.part3.text7') }}
                            </div>
                        </div>
                        <div class="session321221">
                            <div class="text20">
                                {{ $t('YanJingAI2.session3.part3.text8') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
















    <div id="session4" class="session4">
        <div class="session41">
            <div class="session411">
                <div class="text4111">
                    {{ $t('YanJingAI2.session4.text1') }}
                </div>
                <div class="text4112">
                    <p>{{ $t('YanJingAI2.session4.text2') }}</p>
                    <p>{{ $t('YanJingAI2.session4.text3') }}</p>
                </div>
            </div>
            <div class="session412">
                <div class="session4121">
                    <div class="session41211">
                        <div class="session412111">
                            <div class="text412111">
                                01
                            </div>
                        </div>
                        <div class="session412112">
                            <div class="text412112">
                                {{ $t('YanJingAI2.session4.part1.text1') }}
                            </div>
                        </div>
                    </div>
                    <div class="session41212">
                        <div class="img41212">
                            <img src="@/assets/YanJingAI2/image@1x (7).webp" alt="image" />
                        </div>
                    </div>
                    <div class="text4121">
                        <p>{{ $t('YanJingAI2.session4.part1.text2') }}</p>
                        <p>{{ $t('YanJingAI2.session4.part1.text3') }}</p>
                        <p>{{ $t('YanJingAI2.session4.part1.text4') }}</p>
                        <p>{{ $t('YanJingAI2.session4.part1.text5') }}</p>
                    </div>
                </div>
                <div class="session4121">
                    <div class="session41211">
                        <div class="session412111">
                            <div class="text412111">
                                02
                            </div>
                        </div>
                        <div class="session412112">
                            <div class="text412112">
                                {{ $t('YanJingAI2.session4.part2.text1') }}
                            </div>
                        </div>
                    </div>
                    <div class="session41212">
                        <div class="img41212">
                            <img src="@/assets/YanJingAI2/image@1x (8).webp" alt="image" />
                        </div>
                    </div>
                    <div class="text4121">
                        <p>{{ $t('YanJingAI2.session4.part2.text2') }}</p>
                        <p>{{ $t('YanJingAI2.session4.part2.text3') }}</p>
                    </div>
                </div>
                <div class="session4121">
                    <div class="session41211">
                        <div class="session412111">
                            <div class="text412111">
                                03
                            </div>
                        </div>
                        <div class="session412112">
                            <div class="text412112">
                                {{ $t('YanJingAI2.session4.part3.text1') }}
                            </div>
                        </div>
                    </div>
                    <div class="session41212">
                        <div class="img41212">
                            <img src="@/assets/YanJingAI2/image@1x (9).webp" alt="image" />
                        </div>
                    </div>
                    <div class="text4121">
                        <p>{{ $t('YanJingAI2.session4.part3.text2') }}</p>
                        <p>{{ $t('YanJingAI2.session4.part3.text3') }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
















    <div id="session5" class="session5">
        <div class="session51">
            <div class="text511">
                {{ $t('YanJingAI2.session5.text1') }}
            </div>
            <div class="text512">
                {{ $t('YanJingAI2.session5.text2') }}
            </div>
        </div>
        <div class="session52">
            <div class="session521">
                <div class="session5211">
                    <div class="img5211">
                        <img src="@/assets/YanJingAI2/image@1x (10).webp" alt="image" />
                    </div>
                    <div class="session52111">
                        <div class="text521111">
                            {{ $t('YanJingAI2.session5.part1.text1') }}
                        </div>
                        <div class="text521112">
                            <!-- 仅添加 span，不改动 div 顺序 -->
                            <p>{{ $t('YanJingAI2.session5.part1.text2') }} <span class="highlight">{{
                                $t('YanJingAI2.session5.part1.text22') }}</span></p>
                            <p>{{ $t('YanJingAI2.session5.part1.text3') }}</p>
                        </div>
                    </div>
                </div>
                <div class=session5212>
                    <div class="img5212">
                        <img src="@/assets/YanJingAI2/image@1x (11).webp" alt="image" />
                    </div>
                    <div class="session52121">
                        <div class="text521211">
                            {{ $t('YanJingAI2.session5.part2.text1') }}
                        </div>
                        <div class="text521212">
                            <!--这里不用加黑-->
                            <p>{{ $t('YanJingAI2.session5.part2.text2') }} </p>
                            <p>{{ $t('YanJingAI2.session5.part2.text3') }}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="session522">
                <div class="img522">
                    <img src="@/assets/YanJingAI2/b289f57ec5a0c651886bf4566aec681b@1x.webp" alt="image" />
                </div>
            </div>
        </div>
    </div>














    <div id="session6" class="session6">
        <div class=session61>
            <div class="text611">
                {{ $t('YanJingAI2.session6.text1') }}
            </div>
            <div class="text612">
                {{ $t('YanJingAI2.session6.text2') }}
            </div>
        </div>
        <div class=session62>
            <div class="session621">
                <div class="session6211">
                    <div class="icon6211">
                        <img src="@/assets/YanJingAI2/ICON@4x.webp" alt="image" />
                    </div>
                    <div class="session62111">
                        <div class="text621111">
                            {{ $t('YanJingAI2.session6.text3') }}
                        </div>
                        <div class="text621112">
                            {{ $t('YanJingAI2.session6.text4') }}
                        </div>
                    </div>
                </div>
                <div class=session6212>
                    <div class="session62121">
                        <div class="session621211">
                            <div class="img621211">
                                <img src="@/assets/YanJingAI2/image@4x.webp" alt="image" />
                            </div>
                        </div>
                        <div class="session621212">
                            <div class="text6212121">
                                {{ $t('YanJingAI2.session6.part1.text1') }}
                            </div>
                            <div class="text6212122">
                                {{ $t('YanJingAI2.session6.part1.text2') }}
                            </div>
                        </div>
                    </div>
                    <div class="session62122">
                        <div class="session621221">
                            <div class="img621221">
                                <img src="@/assets/YanJingAI2/image@4x (1).webp" alt="image" />
                            </div>
                        </div>
                        <div class="session621222">
                            <div class="text6212221">
                                {{ $t('YanJingAI2.session6.part1.text3') }}
                            </div>
                            <div class="text6212222">
                                {{ $t('YanJingAI2.session6.part1.text4') }}
                            </div>
                        </div>
                    </div>
                    <div class="session62123">
                        <div class="session621231">
                            <div class="img621231">
                                <img src="@/assets/YanJingAI2/image@4x (2).webp" alt="image" />
                            </div>
                        </div>
                        <div class="session621232">
                            <div class="text6212321">
                                {{ $t('YanJingAI2.session6.part1.text5') }}
                            </div>
                            <div class="text6212322">
                                {{ $t('YanJingAI2.session6.part1.text6') }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="session622">
                <div class="icon622">
                    <img src="@/assets/YanJingAI2/ICON@4x (1).webp" alt="image" />
                </div>
                <div class="session6221">
                    <div class="text6221">
                        {{ $t('YanJingAI2.session6.part2.text1') }}
                    </div>
                    <div class="session62211">
                        <div class="session622111">
                            <div class="session6221111">
                                <div class="icon6221111">
                                    <img src="@/assets/YanJingAI2/路径@1x (7).webp" alt="image" />
                                </div>
                            </div>
                            <div class="session6221112">
                                <div class="text6221112">
                                    {{ $t('YanJingAI2.session6.part2.text2') }}
                                </div>
                            </div>
                        </div>
                        <!--div class="session622112">
                            <div class="session6221121">
                                <div class="text6221121">
                                    {{ $t('YanJingAI2.session6.part2.text3') }}
                                </div>
                            </div>
                            <div class="session6221122">
                                <div class="icon6221122">
                                    <img src="@/assets/YanJingAI2/路径@1x (8).webp" alt="image" />
                                </div>
                            </div>
                        </div -->
                    </div>
                </div>
            </div>
            <div class="session623">
                <div class="icon623">
                    <img src="@/assets/YanJingAI2/ICON@4x (2).webp" alt="image" />
                </div>
                <div class="session6231">
                    <div class="text6231">
                        {{ $t('YanJingAI2.session6.part2.text4') }}
                    </div>
                    <div class="session62311">
                        <div class="session623111">
                            <div class="session6231111">
                                <div class="icon6231111">
                                    <img src="@/assets/YanJingAI2/路径@1x (9).webp" alt="image" />
                                </div>
                            </div>
                            <div class="session6231112">
                                <div class="text6231112">
                                    {{ $t('YanJingAI2.session6.part2.text5') }}
                                </div>
                            </div>
                        </div>
                        <div class="session623112">
                            <div class="icon623112">
                                <img src="@/assets/YanJingAI2/容器@4x.webp" alt="image" title="微信"/>
                            </div>
                            <div class="icon623112">
                                <img src="@/assets/YanJingAI2/容器@4x (1).webp" alt="image"  title="微信公众号"/>
                            </div>
                            <div class="icon623112">
                                <img src="@/assets/YanJingAI2/容器@4x (2).webp" alt="image"  title="企业微信"/>
                            </div>
                            <div class="icon623112">
                                <img src="@/assets/YanJingAI2/容器@4x (3).webp" alt="image" title="钉钉"/>
                            </div>
                            <div class="icon623112">
                                <img src="@/assets/YanJingAI2/容器@4x (4).webp" alt="image" title="飞书"/>
                            </div>
                            <div class="icon623113">
                                <img src="@/assets/YanJingAI2/抖音.svg" alt="image" title="抖音"/>
                            </div>
                            <div class="icon623113">
                                <img src="@/assets/YanJingAI2/微博.svg" alt="image" title="微博"/>
                            </div>
                            <div class="icon623113">
                                <img src="@/assets/YanJingAI2/小红书.svg" alt="image" title="小红书"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>



</template>


<style scoped src="./bodypage.css"></style>

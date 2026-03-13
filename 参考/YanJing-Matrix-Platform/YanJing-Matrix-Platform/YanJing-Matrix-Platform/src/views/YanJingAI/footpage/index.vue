<template>
    <div id="footer">
        <div class="foot1">
            <div class="text1">
                <p>
                    {{ $t('YanJingAI2.FOOT.text1') }}
                </p>
                <p>
                    {{ $t('YanJingAI2.FOOT.text2') }}
                </p>
            </div>
            <div class="foot11">
                <div class="text11">
                    {{ $t('YanJingAI2.FOOT.text3') }}
                </div>
                <div class="icon11">
                    <img src="@/assets/YanJingAI2/ICON@1x (2).webp" alt="image" />
                </div>
            </div>
        </div>



        <div class="foot2">
            <div class="foot21">
                <div class="foot211">
                    <div class="icon211">
                        <img src="@/assets/YanJingAI2/研境LOGO@4x.webp" alt="image" />
                    </div>
                    <div class="text2111">
                        <p>
                            {{ $t('YanJingAI2.FOOT.text4') }}
                        </p>
                        <p>
                            {{ $t('YanJingAI2.FOOT.text5') }}
                        </p>
                    </div>
                    <div class="text2112">
                        <p>
                            {{ $t('YanJingAI2.FOOT.text6') }}
                        </p>
                        <p>
                            {{ $t('YanJingAI2.FOOT.text7') }}
                        </p>
                    </div>
                </div>
                <div class="foot212">
                    <div class="foot2121">
                        <div class="text2121">
                            {{ $t('YanJingAI2.FOOT.text8') }}
                        </div>
                        <div class="foot21211">
                            <div class="text21211">
                                {{ $t('YanJingAI2.FOOT.nav.text1') }}
                            </div>
                            <div class="text21211">
                                {{ $t('YanJingAI2.FOOT.nav.text2') }}
                            </div>
                            <div class="text21211">
                                {{ $t('YanJingAI2.FOOT.nav.text3') }}
                            </div>
                            <div class="text21211" @click="openZheshu">
                                {{ $t('YanJingAI2.FOOT.nav.text4') }}
                            </div>
                        </div>
                        <div class="foot21211">
                            <div class="text21211">
                                {{ $t('YanJingAI2.FOOT.nav.text5') }}
                            </div>
                            <div class="text21211">
                                {{ $t('YanJingAI2.FOOT.nav.text6') }}
                            </div>
                            <div class="text21211">
                                {{ $t('YanJingAI2.FOOT.nav.text7') }}
                            </div>
                            <div class="text21211" @click="openGitHub">
                                {{ $t('YanJingAI2.FOOT.nav.text8') }}
                            </div>
                        </div>

                    </div>
                    <div class="foot2122">
                        <div class="text2122">
                            {{ $t('YanJingAI2.FOOT.text9') }}
                        </div>
                        <div class="foot21221">
                            <div class="text21221">
                                {{ $t('YanJingAI2.FOOT.text10') }}
                            </div>
                            <div class="text21222">
                               contact@zheshu.tech
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div class="foot22">
                <div class="text221">
                   @2026 中科浙数 All Rights Reserved.
                </div>
                <div class="text222">
                    <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer" style="color: lavender;">
                        {{ $t('YanJingAI2.FOOT.text13') }}
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped src="./footpage.css"></style>

<script lang="ts" setup>
const openGitHub = () => {
    window.open('https://github.com/Region-AI', '_blank');
};

const openZheshu = () => {
    window.open('https://zheshu.tech', '_blank');
};

</script>
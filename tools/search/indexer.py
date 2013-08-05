from HTMLParser import HTMLParser
import os
import csv
import urllib
import time

dirs = ['cmc_ornithology_grc-81be42dc-4566-4177-8bae-ec0c64c47f15', 'uwymv_mamm-91c9a903-7cf6-4866-a27e-bb460f107120', 'sbmnh_verts-e701125d-7c67-4b40-b2b2-98981d4e508b', 'cuml_sound_film-f7dabf6b-7b67-4fcc-84ed-e0c67600d0a3', 'orn-db5e93b1-cf04-4b33-b31c-46070d78f38c', 'cumv_fish-5638995c-fc4b-4123-8eea-5ddc1f8b9740', 'ichthyology-d72eea78-0730-425d-8f49-0eb1f96b9c81', 'dmns_mamm-79adcfe8-1ee2-4026-87c7-a557ea90df07', 'mvz_bird-77a83f73-681a-481c-be33-d753c90fc25b', 'ubc_bbm_ctc_mammals-582f57ac-96d5-416d-be54-20e9cac36e24', 'cumv_rept-c91b381d-bd36-4d39-9e8c-d39c3c6884f8', 'mlz_bird-032aceb9-0a8c-48ee-9f37-1a3120b9c96b', 'uwymv_herp-06920140-b3ff-4136-9d3b-629b4c5b23af', 'kstc_schmidt_birds-2722c102-a2cc-41e0-a8b3-e6eb7906b6af', 'ucmp_vertpaleo-eace2f35-6802-46ae-9665-122a51800c96', 'hsu_wildlife_mammals-dfa8b674-e706-4768-8e4a-58047da1771b', 'ummz_birds-890a832b-351e-4e3b-bef8-2ef88668c20f', 'cumv_bird-98a24819-f126-4b5a-be67-7dec9ac9e772', 'wnmu_fish-d777c5fd-d3e6-4241-aeb3-86747831430c', 'mvzobs_bird-40da15bd-e371-4710-a753-6370d46ac316', 'perot_verts-65497faa-c8a5-49c2-820b-3187e5a16d53', 'tcwc_verts-8e31bb8d-079a-4d03-9e22-0d5b6ef4655a', 'uam_fish-ad81098e-73ea-4bc2-8d26-5f365207b9de', 'uam_es-ba9eccf0-2949-4152-8e35-a67ba7c15ac9', 'dmnh_birds-0493d95c-00ec-48f6-b618-de94d5c72789', 'uam_bird-daa41baa-a421-4b32-8b4f-ff73038034b2', 'mammalogyspecimens-062e5574-e937-4d91-9450-9f453b312ac8', 'vertebratepalaeorecentskeletons-3abc5a7d-ec91-431d-9f65-270b8f96e847', 'uafmc_fish-105f85bc-51fd-4a1c-8f4d-0dc8e7a5ddff', 'ummz_mammals-d311957f-04c6-4f5a-897d-6e5327bd71a2', 'nysm_mammals-8a45f5c4-2140-4d67-911c-c1db38992532', 'uam_herp-1c99804c-69b9-4a95-ae31-7d624bcde0b2', 'lacm_verts-48db2dbe-48b1-49a0-9340-79ecfc957ef7', 'mvz_herp-cd760c45-a8e3-43e1-a749-c322c112e399', 'herp-b84f680c-4ed0-4bd2-8a46-86572d317b7e', 'smns_herps-551b29b3-170b-4f6a-a940-95c7cab3656f', 'mlz_mamm-98419553-ceec-472d-961e-8c4d4057106f', 'wfvz_birds-eab9d3ee-8bb1-4e51-905d-f6a093153672', 'uta_herps-aa1833f1-7bb5-464f-9e94-6739cdc55a77', 'msb_mamm-ce58afbc-ffe4-4a7f-8061-d69b91623db4', 'uwymv_bird-4c1ac867-f030-4d34-aa48-ba5272c883b7', 'ubc_bbm_ctc_herps-b6d962a3-409a-471f-8f3a-870237eb1875', 'fm_birds-f4e87a0f-abd7-46cd-8987-9a91404e926a', 'mvz_mammal-a56a93ac-ddc1-4420-bd69-e1c11f5cd394', 'fmnh_herps-d1e1008a-aea7-438e-86f4-5f5f0f1f51b2', 'kubi_mammals-5622bc2e-190c-4ea0-aa2c-1fb2cd61c0da', 'kubi_ornithology-f86d5bc0-faf9-4a68-b949-3017bd3b979a', 'hsu_wildlife_birds-0e12a66f-8dc0-4784-9f65-033a8233d6c3', 'msbobs_mamm-0efb8114-cceb-46e8-bfb1-1dac250e1dc8', 'fmnh_fishes-18831b3d-d954-4f4d-912e-04d93d55d176', 'isu_birds-87f3c6f0-c591-461a-9561-8f4754f3e2ab', 'uamobs_mamm-4b68ad31-aac0-49a1-bac4-a6beae357e6e', 'uwbm_herp-40412c65-d69b-4381-9f6d-7e4b53642e10', 'crcm_verts-8ef9f5ee-0153-461f-aa52-910e65d9640b', 'kstc_schmidt_mammals-2ed8c3b5-8eab-4380-8cef-87b7a12de2f4', 'birdspasserines-9dd2cfa7-7f6d-4b8c-ba7d-dd4cf47903b1', 'mvz_egg-9c1460f0-fc96-4b2b-8761-79a33f0dea3e', 'oregonstate_fish-7bfd3dfb-fbd2-4aa0-8899-08993fc8c933', 'ttrs_mammals-1d524595-8ca7-42fe-8ae3-faaa1bdedaae', 'mam-ed052883-abe7-4b40-a558-f07fd901932e', 'kubi_herps-ca6123e4-5524-442b-872b-c69b8be40093', 'fmnh_mammals-17890677-0f68-44cc-8b89-cea04bdde243', 'birdsnonpasserines-e4a5723c-7e2f-4fad-b9e3-ca618b3841c0', 'nmmnh_mammals-1535b262-3edf-4c0d-ae54-dec8c8889ef0', 'wnmu_mamm-331794da-0b1f-4395-97d3-9246d10172b4', 'ubc_bbm_ctc_birds-548a4710-3ca5-4852-b8a5-9292e9fe3797', 'hsu_wildlife_eggs_nests-6f74da51-a130-467d-96a7-331967997307', 'uafmc_mammals-10807b3d-0f8d-4388-8b7d-9edc940a2f78', 'cm_herps-3b8aca09-a938-4b2d-87b2-25db53a3ca92', 'umzc_vertebrates-2b9d9fd8-d541-4067-91d7-c095bc0b21d6', 'cmc_herpetology_vouchers-9d02934f-c704-41dc-b762-4a2b6063a615', 'herpetology-f22cd0cf-61cf-4b1d-b4e5-0d23dd7bedbf', 'cm_birds-295a1252-adb6-410c-9754-79d6cb2032dd', 'fishes-3e796c5c-a774-4195-9741-b8517d7ac2ce', 'dmns_bird-6f0fd612-c69d-4983-a99f-003adb56b558', 'kubi_ichthyology-a264c6d8-62c4-4c0d-bfde-ca9b3f48d755', 'mpm_herps-195411d2-21dd-4ff1-9257-292df283fe30', 'mammals-694f1140-08c0-45da-94b2-9e2b49798836', 'unr_herps-22dd2bcf-94bc-4fc9-9af4-dae7d2967d21', 'mvzobs_mammal-c2edc40d-3bc5-4d83-906d-9a3cfc5c7d3f', 'psm_verts-8a61dc4f-d3f5-473a-8e61-91d3de2dad3a', 'ttrs_birds-dda1a7d1-1351-4598-b337-587663b71b9e', 'uam_mamm-adcca2bb-d35f-4820-8178-11c0ff5f51a9', 'msb_bird-2b0693d0-c86b-432c-a29f-f9a8154da627', 'gsu_herps-e041913d-c666-45b7-8d33-d2f8e601125b', 'mvz_hild-86cde4a0-6592-48d5-af0a-0aff012c9cc4', 'kubi_ornithology_tissue-381ec997-0aae-492b-b24d-5fb171c98945', 'mvzobs_herp-04c7fff6-7f1c-4d58-ae19-ad9648b38d44', 'ich-397db818-5b37-450e-b6ad-f37c3435b4bf', 'utep_verts-8a9ab8fd-c8a0-4dad-a3f7-3b2d2aed3743', 'isu_mammals-40a14977-6ba2-4fb3-bf05-feed1feaa5bd', 'mcz_subset_for_vertnet-95eefc15-2209-4079-8543-4b8bb54822ea', 'herpetology-bfcda88c-f906-4f65-bf27-ac15c42910fc', 'cumv_amph-4b2d3815-80c1-45a9-94cd-9e324186c026', 'kubi_ichthyology_tissue-cb0cb778-f246-4073-bc18-a3306627a4e8', 'cumv_mamm-b3df2cef-6ed7-48ec-9831-4aa3b89e7ac9', 'wnmu_bird-50e7131c-a22d-48c6-a5fa-fba624c5aff0']
names = ['ich', 'fmnh_mammals', 'cuml_sound_film', 'mvz_bird', 'cm_herps', 'herpetology', 'kubi_mammals', 'ummz_mammals', 'fishes', 'uam_mamm', 'kubi_ornithology', 'birdspasserines', 'uta_herps', 'mammalogyspecimens', 'fmnh_fishes', 'orn', 'cumv_fish', 'dmnh_birds', 'umzc_vertebrates', 'psm_verts', 'mlz_bird', 'birdsnonpasserines', 'cumv_bird', 'utep_verts', 'herpetology', 'dmns_bird', 'kubi_ichthyology', 'sbmnh_verts', 'mammals', 'uam_es', 'mam', 'mpm_herps', 'crcm_verts', 'msb_bird', 'kubi_ornithology_tissue', 'gsu_herps', 'cumv_mamm', 'ubc_bbm_ctc_birds', 'ubc_bbm_ctc_mammals', 'oregonstate_fish', 'nysm_mammals', 'mvz_egg', 'dmns_mamm', 'cumv_amph', 'cumv_rept', 'kubi_ichthyology_tissue', 'uam_bird', 'vertebratepalaeorecentskeletons', 'hsu_wildlife_birds', 'uwbm_herp', 'cmc_herpetology_vouchers', 'perot_verts', 'smns_herps', 'wnmu_mamm', 'uwymv_mamm', 'nmmnh_mammals', 'unr_herps', 'uafmc_fish', 'uam_fish', 'mvzobs_bird', 'ttrs_birds', 'uafmc_mammals', 'isu_birds', 'hsu_wildlife_mammals', 'hsu_wildlife_eggs_nests', 'mlz_mamm', 'uwymv_bird', 'ubc_bbm_ctc_herps', 'kstc_schmidt_birds', 'wnmu_bird', 'cmc_ornithology_grc', 'isu_mammals', 'kstc_schmidt_mammals', 'ttrs_mammals', 'mvz_hild', 'wnmu_fish', 'uam_herp', 'uamobs_mamm', 'mvzobs_mammal', 'mvzobs_herp', 'uwymv_herp', 'msbobs_mamm']

def index():
    for x in dirs:
        name = x.split('-')[0]
        if name in names:
            url = "http://index.vertnet-portal.appspot.com/mr/%s/%s" % (x, x)
            print url
            f = urllib.urlopen("http://index.vertnet-portal.appspot.com/mr/%s/%s" % (x, x))
            print f.read()
            time.sleep(3)



# create a subclass and override the handler methods
class MyHTMLParser(HTMLParser):
    # def __init__(self):
    #     super(HTMLParser, self).__init__()
    #     self._id = False

    def handle_starttag(self, tag, attrs):
        pass

    def handle_endtag(self, tag):
        if tag == 'tr':
            self._id = True
        print '\n'

    def handle_data(self, data):
        if self._id:
            print 'http://index.vertnet-portal.appspot.com/mapreduce/detail?mapreduce_id=%s' % data, 
            self._id = False
        else:
            print '%s,' % data,

parser = MyHTMLParser()
parser.feed(data)
